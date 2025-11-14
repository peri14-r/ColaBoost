import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Handshake, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

interface Collaboration {
  id: string;
  title: string | null;
  description: string | null;
  status: string;
  created_at: string;
  requester_id: string;
  receiver_id: string;
  requester_profile?: {
    name: string | null;
    profile_picture_url: string | null;
  };
  receiver_profile?: {
    name: string | null;
    profile_picture_url: string | null;
  };
}

export default function Collaborations() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loadingCollabs, setLoadingCollabs] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCollaborations();
    }
  }, [user]);

  const fetchCollaborations = async () => {
    try {
      // SECURITY NOTE: This template literal is safe because user.id comes from auth.uid()
      // which returns a validated UUID. NEVER use template literals with user-controlled input!
      const { data: collabData, error } = await supabase
        .from('collaborations')
        .select('*')
        .or(`requester_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data for each collaboration
      const collaborationsWithProfiles = await Promise.all(
        (collabData || []).map(async (collab) => {
          const [requesterProfile, receiverProfile] = await Promise.all([
            supabase
              .from('discoverable_profiles')
              .select('name, profile_picture_url')
              .eq('id', collab.requester_id)
              .single(),
            supabase
              .from('discoverable_profiles')
              .select('name, profile_picture_url')
              .eq('id', collab.receiver_id)
              .single()
          ]);

          return {
            ...collab,
            requester_profile: requesterProfile.data,
            receiver_profile: receiverProfile.data
          };
        })
      );

      setCollaborations(collaborationsWithProfiles);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
      toast({
        title: "Error",
        description: "Failed to load collaborations",
        variant: "destructive",
      });
    } finally {
      setLoadingCollabs(false);
    }
  };

  const updateCollaborationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('collaborations')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setCollaborations(prev => 
        prev.map(collab => 
          collab.id === id ? { ...collab, status } : collab
        )
      );

      toast({
        title: "Success",
        description: `Collaboration ${status} successfully`,
      });
    } catch (error) {
      console.error('Error updating collaboration:', error);
      toast({
        title: "Error",
        description: "Failed to update collaboration",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const sent = collaborations.filter(c => c.requester_id === user?.id);
  const received = collaborations.filter(c => c.receiver_id === user?.id);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Collaborations</h1>
            <p className="text-muted-foreground">
              Manage your collaboration requests and ongoing projects
            </p>
          </div>

          <Tabs defaultValue="received" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="received">
                Received ({received.length})
              </TabsTrigger>
              <TabsTrigger value="sent">
                Sent ({sent.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received">
              <div className="space-y-4">
                {loadingCollabs ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
                    ))}
                  </div>
                ) : received.length > 0 ? (
                  received.map((collab) => (
                    <Card key={collab.id} className="hover:shadow-hover transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={collab.requester_profile?.profile_picture_url || undefined} />
                              <AvatarFallback>
                                {collab.requester_profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">
                                {collab.title || 'Collaboration Request'}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                From {collab.requester_profile?.name || 'Anonymous'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(collab.status)}>
                              {getStatusIcon(collab.status)}
                              <span className="ml-1 capitalize">{collab.status}</span>
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {collab.description || 'No description provided'}
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Received {new Date(collab.created_at).toLocaleDateString()}
                        </p>
                        {collab.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="hero"
                              onClick={() => updateCollaborationStatus(collab.id, 'accepted')}
                            >
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateCollaborationStatus(collab.id, 'rejected')}
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                        {collab.status === 'accepted' && (
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate('/messages')}
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Message
                            </Button>
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => updateCollaborationStatus(collab.id, 'completed')}
                            >
                              Mark Complete
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No collaboration requests received yet</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sent">
              <div className="space-y-4">
                {sent.length > 0 ? (
                  sent.map((collab) => (
                    <Card key={collab.id} className="hover:shadow-hover transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={collab.receiver_profile?.profile_picture_url || undefined} />
                              <AvatarFallback>
                                {collab.receiver_profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">
                                {collab.title || 'Collaboration Request'}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                To {collab.receiver_profile?.name || 'Anonymous'}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(collab.status)}>
                            {getStatusIcon(collab.status)}
                            <span className="ml-1 capitalize">{collab.status}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {collab.description || 'No description provided'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sent {new Date(collab.created_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No collaboration requests sent yet</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}