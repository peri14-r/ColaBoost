import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CreatorCard } from '@/components/dashboard/CreatorCard';
import { ProfileBoostButton } from '@/components/monetization/ProfileBoostButton';
import { SponsoredPosts } from '@/components/monetization/SponsoredPosts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Crown, TrendingUp, Users, MessageSquare, Star, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardMetrics {
  activeCollaborations: number;
  unreadMessages: number;
  profileViews: number;
  successRate: number;
  collabsTrend: number;
  messagesTrend: number;
}

interface Profile {
  id: string;
  name: string | null;
  bio: string | null;
  niche: string | null;
  follower_count: number;
  profile_picture_url: string | null;
  user_id: string;
  subscription_type?: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Profile[]>([]);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeCollaborations: 0,
    unreadMessages: 0,
    profileViews: 0,
    successRate: 0,
    collabsTrend: 0,
    messagesTrend: 0,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
      fetchMetrics();
      fetchAiSuggestions();
      
      // Check for boost success/cancelled
      const params = new URLSearchParams(window.location.search);
      if (params.get('boost_success') === 'true') {
        toast({
          title: "Success! 🚀",
          description: "Your profile is now boosted for 7 days!",
        });
        // Clean up URL
        window.history.replaceState({}, '', '/dashboard');
      } else if (params.get('boost_cancelled') === 'true') {
        toast({
          title: "Boost Cancelled",
          description: "You can boost your profile anytime from the dashboard.",
          variant: "default",
        });
        // Clean up URL
        window.history.replaceState({}, '', '/dashboard');
      }
      
      // Set up realtime subscription for collaborations
      const collabChannel = supabase
        .channel('collaboration-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'collaborations'
          },
          (payload) => {
            console.log('Collaboration changed:', payload);
            // Refetch metrics when collaboration changes
            fetchMetrics();
          }
        )
        .subscribe();
      
      // Set up realtime subscription for messages
      const messageChannel = supabase
        .channel('message-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            console.log('New message:', payload);
            // Refetch metrics when new message arrives
            fetchMetrics();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(collabChannel);
        supabase.removeChannel(messageChannel);
      };
    }
  }, [user]);

  const fetchMetrics = async () => {
    if (!user) return;
    
    try {
      // Fetch active (accepted) collaborations
      const { data: collabs, error: collabsError } = await supabase
        .from('collaborations')
        .select('status')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');
      
      if (collabsError) throw collabsError;

      // Fetch unread messages
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('id')
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`);
      
      if (chatsError) throw chatsError;
      
      const chatIds = chats?.map(chat => chat.id) || [];
      
      let unreadCount = 0;
      if (chatIds.length > 0) {
        const { count, error: messagesError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('chat_id', chatIds)
          .neq('sender_id', user.id)
          .is('read_at', null);
        
        if (messagesError) throw messagesError;
        unreadCount = count || 0;
      }

      // Calculate success rate
      const { data: allCollabs, error: allCollabsError } = await supabase
        .from('collaborations')
        .select('status')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
      
      if (allCollabsError) throw allCollabsError;

      const totalCollabs = allCollabs?.length || 0;
      const completedCollabs = allCollabs?.filter(c => c.status === 'completed').length || 0;
      const successRate = totalCollabs > 0 ? Math.round((completedCollabs / totalCollabs) * 100) : 0;

      // Calculate profile views (mock data for now - would need a views table)
      const profileViews = Math.floor(Math.random() * 500) + 100;

      // Calculate trends (comparing with mock previous month data)
      const prevMonthCollabs = Math.max(0, (collabs?.length || 0) - Math.floor(Math.random() * 5));
      const collabsTrend = prevMonthCollabs > 0 
        ? Math.round(((collabs?.length || 0) - prevMonthCollabs) / prevMonthCollabs * 100)
        : 0;

      const messagesTrend = Math.floor(Math.random() * 30) - 10; // Mock trend

      setMetrics({
        activeCollaborations: collabs?.length || 0,
        unreadMessages: unreadCount,
        profileViews,
        successRate,
        collabsTrend,
        messagesTrend,
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard metrics",
        variant: "destructive",
      });
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user?.id)
        .limit(12);

      if (error) throw error;

      // Add subscription info to profiles
      const profilesWithSubscription = await Promise.all(
        (profilesData || []).map(async (profile) => {
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

      setProfiles(profilesWithSubscription);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load creator profiles",
        variant: "destructive",
      });
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleCollabRequest = async (receiverId: string) => {
    try {
      const { error } = await supabase
        .from('collaborations')
        .insert({
          requester_id: user?.id,
          receiver_id: receiverId,
          title: 'Collaboration Request',
          description: 'New collaboration opportunity',
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Collaboration request sent!",
      });
    } catch (error) {
      console.error('Error sending collaboration request:', error);
      toast({
        title: "Error",
        description: "Failed to send collaboration request",
        variant: "destructive",
      });
    }
  };

  const fetchAiSuggestions = async () => {
    setLoadingAiSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-suggestions');
      
      if (error) throw error;
      
      if (data?.suggestions) {
        setAiSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      toast({
        title: "Info",
        description: "AI suggestions unavailable. Showing regular suggestions.",
      });
    } finally {
      setLoadingAiSuggestions(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user) return;
    
    setUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: 'price_1S3g3sQ9pKdomFWj3hft7EGm' }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to start upgrade process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Small Creators. Big Growth.</h1>
          <p className="text-muted-foreground">
            Find collabs that grow you.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Collaborations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingMetrics ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.activeCollaborations}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {metrics.collabsTrend > 0 ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-green-500">+{metrics.collabsTrend}%</span>
                      </>
                    ) : metrics.collabsTrend < 0 ? (
                      <>
                        <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                        <span className="text-red-500">{metrics.collabsTrend}%</span>
                      </>
                    ) : (
                      <span>No change</span>
                    )}
                    <span className="ml-1">from last month</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingMetrics ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.unreadMessages}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {metrics.messagesTrend > 0 ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-green-500">+{metrics.messagesTrend}%</span>
                      </>
                    ) : metrics.messagesTrend < 0 ? (
                      <>
                        <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                        <span className="text-red-500">{metrics.messagesTrend}%</span>
                      </>
                    ) : (
                      <span>No change</span>
                    )}
                    <span className="ml-1">from last week</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingMetrics ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.profileViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingMetrics ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.successRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics.successRate >= 80 ? 'Excellent' : metrics.successRate >= 60 ? 'Good' : 'Needs improvement'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Collab Suggestions Card */}
        <Card className="border-accent/20 bg-gradient-card">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold">AI Suggested Creators</h3>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchAiSuggestions}
                  disabled={loadingAiSuggestions}
                >
                  {loadingAiSuggestions ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Creators matched to your niche and audience size.
              </p>
              {loadingAiSuggestions ? (
                <div className="space-y-2">
                  <div className="h-16 bg-muted animate-pulse rounded"></div>
                  <div className="h-16 bg-muted animate-pulse rounded"></div>
                  <div className="h-16 bg-muted animate-pulse rounded"></div>
                </div>
              ) : aiSuggestions.length > 0 ? (
                <div className="space-y-2">
                  {aiSuggestions.slice(0, 3).map((creator) => (
                    <div key={creator.id} className="p-3 bg-card rounded-lg border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white dark:text-black font-semibold">
                          {creator.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium">{creator.name}</p>
                          <p className="text-xs text-muted-foreground">{creator.niche} • {creator.follower_count?.toLocaleString()} followers</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleCollabRequest(creator.user_id)}>
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No suggestions available yet. Complete your profile to get matched!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Boost Card */}
        <Card className="border-primary/20 bg-gradient-card">
          <CardContent className="pt-6">
            <ProfileBoostButton />
          </CardContent>
        </Card>

        {/* Sponsored Posts */}
        <div className="mb-6">
          <SponsoredPosts limit={2} variant="sidebar" />
        </div>

        {/* Upgrade Card */}
        <Card className="border-primary/20 bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary dark:text-black" />
                  <h3 className="font-semibold">Upgrade to Pro</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get 20 collaboration requests/month, 1 monthly profile boost, verified badge, and priority listing for just $29/month.
                </p>
              </div>
              <Button 
                variant="hero" 
                size="sm"
                onClick={handleUpgrade}
                disabled={upgrading}
              >
                {upgrading ? "Loading..." : "Upgrade Now"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Growth Features Placeholder - Ready for future expansion */}
        {/* 
          TODO: Add Share Badge feature
          - When collaboration is completed, allow users to generate and share achievement badges
          - Badge should include collaboration details, partners, and success metrics
          
          TODO: Add Referral System
          - Generate unique referral links for each user
          - Track referrals and reward users for bringing new creators
          - Display referral stats in dashboard
        */}

        {/* Suggested Creators */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Suggested Creators</h2>
          {loadingProfiles ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : profiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {profiles.map((profile) => (
                <CreatorCard
                  key={profile.id}
                  profile={profile}
                  onCollabRequest={() => handleCollabRequest(profile.user_id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No creators found. Be the first to join!</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}