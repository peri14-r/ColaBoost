import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Rocket, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProfileBoost {
  id: string;
  end_date: string;
  status: string;
}

export function ProfileBoostButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [activeBoost, setActiveBoost] = useState<ProfileBoost | null>(null);

  useEffect(() => {
    if (user) {
      checkActiveBoost();
    }
  }, [user]);

  const checkActiveBoost = async () => {
    try {
      const { data } = await supabase
        .from('profile_boosts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .single();

      setActiveBoost(data);
    } catch (error) {
      console.error('Error checking boost status:', error);
    }
  };

  const handleBoost = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('boost-profile-checkout', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error initiating boost:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate profile boost',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowDialog(false);
    }
  };

  if (activeBoost) {
    const daysLeft = Math.ceil(
      (new Date(activeBoost.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <div className="flex items-center space-x-2 px-4 py-3 bg-gradient-card rounded-lg border">
        <Sparkles className="h-5 w-5 text-primary dark:text-black" />
        <div className="flex-1">
          <p className="text-sm font-medium">Profile Boosted! 🚀</p>
          <p className="text-xs text-muted-foreground">{daysLeft} days remaining</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="default"
        className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
      >
        <Rocket className="mr-2 h-4 w-4" />
        Boost My Profile
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Rocket className="h-5 w-5 text-primary dark:text-black" />
              <span>Boost Your Profile</span>
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <div className="text-foreground">
                <p className="font-semibold mb-2">Get featured for 7 days!</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="mr-2">✨</span>
                    <span>Appear higher in search results</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🎯</span>
                    <span>Get discovered by more creators</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🚀</span>
                    <span>Increase collaboration opportunities</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-gradient-card rounded-lg">
                  <p className="text-2xl font-bold">$10</p>
                  <p className="text-sm text-muted-foreground">One-time payment</p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleBoost} disabled={loading} className="bg-gradient-hero">
              {loading ? 'Processing...' : 'Boost Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
