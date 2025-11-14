import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Webhook signature or secret missing', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log('Webhook event:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      const userId = session.metadata?.user_id;
      const boostDurationDays = parseInt(session.metadata?.boost_duration_days || '7');

      if (!userId) {
        console.error('No user_id in session metadata');
        return new Response('No user_id', { status: 400 });
      }

      // Initialize Supabase with service role key
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Calculate end date
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + boostDurationDays);

      // Create profile boost record
      const { error: boostError } = await supabaseAdmin
        .from('profile_boosts')
        .insert({
          user_id: userId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          stripe_payment_intent_id: session.payment_intent as string,
          amount_paid: session.amount_total || 1000,
          status: 'active',
        });

      if (boostError) {
        console.error('Error creating boost:', boostError);
        throw boostError;
      }

      console.log('Profile boost created successfully for user:', userId);

      // Create notification
      await supabaseAdmin.rpc('create_notification', {
        target_user_id: userId,
        notification_type: 'collab',
        notification_title: 'Profile Boosted! 🚀',
        notification_body: `Your profile is now boosted for ${boostDurationDays} days and will appear higher in search results.`,
        notification_link: '/dashboard',
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return new Response(err.message, { status: 400 });
  }
});
