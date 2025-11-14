import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Crown, Check, Zap, Users, MessageSquare, Star } from 'lucide-react';

interface Subscription {
  id: string;
  subscription_type: string;
  status: string;
  current_period_end: string | null;
  created_at: string;
}

export default function Payments() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  // Refresh subscription after returning from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const upgrade = params.get('upgrade');
    if (upgrade === 'success') {
      (async () => {
        try {
          const { error } = await supabase.functions.invoke('check-subscription');
          if (error) throw error;
          await fetchSubscription();
          toast({ title: 'Success', description: 'Subscription updated successfully.' });
        } catch (e) {
          console.error('Error refreshing subscription:', e);
          toast({ title: 'Error', description: 'Could not refresh subscription.', variant: 'destructive' });
        }
      })();
    } else if (upgrade === 'cancelled') {
      toast({ title: 'Cancelled', description: 'Checkout was cancelled.' });
    }
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('safe_subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription details",
        variant: "destructive",
      });
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: 'price_1S3g3sQ9pKdomFWj3hft7EGm' }
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      toast({ title: 'Error', description: 'Failed to start checkout.', variant: 'destructive' });
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for getting started',
      features: [
        'Up to 3 collaboration requests per month',
        'Basic messaging',
        'Profile creation',
        'Community access'
      ],
      buttonText: 'Current Plan',
      disabled: true,
      popular: false
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      description: 'For serious creators and businesses',
      features: [
        'Up to 20 collaboration requests per month',
        '1 monthly profile boost',
        'Priority listing in creator search',
        'Verified badge',
        'Priority support',
        'Advanced analytics',
        'Custom branding',
        'Direct messaging',
        'Project management tools',
        'Export capabilities'
      ],
      buttonText: 'Upgrade to Pro',
      disabled: false,
      popular: true
    }
  ];

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>

        {/* Current Subscription */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSubscription ? (
              <div className="h-16 bg-muted animate-pulse rounded-lg"></div>
            ) : subscription ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge 
                      variant="secondary" 
                      className={subscription.subscription_type === 'pro' ? 'bg-gradient-primary text-white dark:text-black' : ''}
                    >
                      {subscription.subscription_type === 'pro' && <Crown className="mr-1 h-3 w-3" />}
                      {subscription.subscription_type.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {subscription.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {subscription.subscription_type === 'free' 
                      ? 'You are currently on the free plan'
                      : subscription.current_period_end 
                        ? `Next billing date: ${new Date(subscription.current_period_end).toLocaleDateString()}`
                        : 'Pro subscription active'
                    }
                  </p>
                </div>
                {subscription.subscription_type === 'free' && (
                  <Button variant="hero" onClick={handleUpgrade}>
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No subscription found</p>
            )}
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Plan</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative ${plan.popular ? 'ring-2 ring-primary shadow-glow' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-primary text-white dark:text-black px-4 py-1">
                      <Star className="mr-1 h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">
                    {plan.name}
                    {plan.name === 'Pro' && <Crown className="inline ml-2 h-5 w-5 text-primary" />}
                  </CardTitle>
                  <div className="text-3xl font-bold">
                    {plan.price}
                    <span className="text-lg font-normal text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "hero" : "outline"}
                    disabled={plan.disabled || (subscription?.subscription_type === 'pro' && plan.name === 'Pro')}
                    onClick={plan.name === 'Pro' ? handleUpgrade : undefined}
                  >
                    {subscription?.subscription_type === 'pro' && plan.name === 'Pro' 
                      ? 'Current Plan' 
                      : plan.buttonText
                    }
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              Usage This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {subscription?.subscription_type === 'free' ? '2/3' : '∞'}
                </p>
                <p className="text-sm text-muted-foreground">Collaboration Requests</p>
              </div>
              <div className="text-center">
                <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">Messages Sent</p>
              </div>
              <div className="text-center">
                <Crown className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {subscription?.subscription_type === 'pro' ? 'Unlimited' : 'Limited'}
                </p>
                <p className="text-sm text-muted-foreground">Features Access</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}