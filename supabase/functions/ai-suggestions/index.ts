import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get other profiles to suggest
    const { data: allProfiles } = await supabase
      .from('discoverable_profiles')
      .select('*')
      .neq('id', profile?.id)
      .limit(20);

    if (!allProfiles || allProfiles.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use AI to rank and suggest collaborators
    const prompt = `You are an AI assistant helping small creators find collaboration partners. 

Current user profile:
- Niche: ${profile?.niche || 'Unknown'}
- Follower count: ${profile?.follower_count || 0}
- Bio: ${profile?.bio || 'No bio'}

Available creators:
${allProfiles.map((p, i) => `${i + 1}. ${p.name} - ${p.niche} (${p.follower_count} followers) - ${p.bio}`).join('\n')}

Based on niche compatibility, follower similarity, and potential synergy, recommend the top 3-5 creators for collaboration. Return ONLY a JSON array of profile IDs in order of recommendation quality.

Example format: ["id1", "id2", "id3"]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a helpful AI that suggests creator collaborations. Always respond with valid JSON arrays." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let suggestedIds: string[] = [];
    
    try {
      const content = data.choices[0].message.content;
      // Try to parse JSON from the response with validation
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Validate it's an array of valid UUIDs
        if (Array.isArray(parsed) && 
            parsed.every(id => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id))) {
          suggestedIds = parsed.slice(0, 10); // Limit to 10 suggestions max
        } else {
          console.error("AI response validation failed: invalid UUID array format");
        }
      }
    } catch (e) {
      console.error("Error parsing AI response:", e);
      // Fallback: return top 3 profiles by follower count
      suggestedIds = allProfiles
        .sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0))
        .slice(0, 3)
        .map(p => p.id);
    }

    // Get full profile data for suggested IDs
    const suggestions = allProfiles.filter(p => suggestedIds.includes(p.id!));

    // Add subscription information to suggestions
    const suggestionsWithSubscription = await Promise.all(
      suggestions.map(async (profile) => {
        const { data: subscriptionData } = await supabase
          .from('safe_subscriptions')
          .select('subscription_type')
          .eq('user_id', profile.user_id)
          .single();

        return {
          ...profile,
          subscription_type: subscriptionData?.subscription_type || 'free',
        };
      })
    );

    return new Response(JSON.stringify({ suggestions: suggestionsWithSubscription }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-suggestions function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
