import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CreatorCard } from '@/components/dashboard/CreatorCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Users } from 'lucide-react';

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

export default function FindCreators() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string>('');

  const niches = ['Tech', 'Fashion', 'Food', 'Travel', 'Fitness', 'Beauty', 'Gaming', 'Music', 'Art', 'Business'];

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  useEffect(() => {
    filterProfiles();
  }, [profiles, searchTerm, selectedNiche]);

  const fetchProfiles = async () => {
    try {
      // Fetch profiles with boost status and subscription info
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user?.id);

      if (error) throw error;

      // Check boost status and subscription for each profile
      const profilesWithBoost = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: boostData } = await supabase
            .from('profile_boosts')
            .select('*')
            .eq('user_id', profile.user_id)
            .eq('status', 'active')
            .gte('end_date', new Date().toISOString())
            .single();

          const { data: subscriptionData } = await supabase
            .from('safe_subscriptions')
            .select('subscription_type')
            .eq('user_id', profile.user_id)
            .single();

          return {
            ...profile,
            is_boosted: !!boostData,
            subscription_type: subscriptionData?.subscription_type || 'free',
          };
        })
      );

      // Sort: boosted profiles first, then by follower count
      const sortedProfiles = profilesWithBoost.sort((a, b) => {
        if (a.is_boosted && !b.is_boosted) return -1;
        if (!a.is_boosted && b.is_boosted) return 1;
        return (b.follower_count || 0) - (a.follower_count || 0);
      });

      setProfiles(sortedProfiles);
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

  const filterProfiles = () => {
    let filtered = profiles;

    if (searchTerm) {
      filtered = filtered.filter(profile => 
        profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.niche?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedNiche) {
      filtered = filtered.filter(profile => 
        profile.niche?.toLowerCase() === selectedNiche.toLowerCase()
      );
    }

    setFilteredProfiles(filtered);
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

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find Creators</h1>
        <p className="text-muted-foreground">
          Discover amazing creators and start your next collaboration
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search creators by name, bio, or niche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter by niche:</span>
          <Button
            variant={selectedNiche === '' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setSelectedNiche('')}
          >
            All
          </Button>
          {niches.map(niche => (
            <Button
              key={niche}
              variant={selectedNiche === niche ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setSelectedNiche(niche)}
            >
              {niche}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">
            {filteredProfiles.length} Creators Found
          </h2>
        </div>
        
        {loadingProfiles ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : filteredProfiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProfiles.map((profile) => (
              <CreatorCard
                key={profile.id}
                profile={profile}
                onCollabRequest={() => handleCollabRequest(profile.user_id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || selectedNiche 
                ? 'No creators match your search criteria.' 
                : 'No creators found. Be the first to join!'
              }
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}