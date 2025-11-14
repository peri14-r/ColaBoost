import { useState, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Calendar, User, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Collaboration {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  title: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  requester_profile?: {
    name: string | null;
    profile_picture_url: string | null;
  };
  receiver_profile?: {
    name: string | null;
    profile_picture_url: string | null;
  };
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary">Pending</Badge>;
    case 'accepted':
      return <Badge className="bg-success text-success-foreground">Active</Badge>;
    case 'completed':
      return <Badge className="bg-primary text-primary-foreground">Completed</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function MyCollabs() {
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
    if (!user) return;

    try {
      // SECURITY NOTE: This template literal is safe because user.id comes from auth.uid()
      // which returns a validated UUID. NEVER use template literals with user-controlled input!
      const { data, error } = await supabase
        .from('collaborations')
        .select('*')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data for each collaboration
      const collaborationsWithProfiles = await Promise.all(
        (data || []).map(async (collab) => {
          const requesterProfile = await supabase
            .from('discoverable_profiles')
            .select('name, profile_picture_url')
            .eq('id', collab.requester_id)
            .single();

          const receiverProfile = await supabase
            .from('discoverable_profiles')
            .select('name, profile_picture_url')
            .eq('id', collab.receiver_id)
            .single();

          return {
            ...collab,
            requester_profile: requesterProfile.data,
            receiver_profile: receiverProfile.data,
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

  const handleMessageClick = async (otherUserId: string) => {
    try {
      // SECURITY NOTE: These template literals are safe because both user.id and otherUserId 
      // come from auth.uid() which returns validated UUIDs. NEVER use template literals with user-controlled input!
      // Check if chat already exists
      const { data: existingChats, error: fetchError } = await supabase
        .from('chats')
        .select('id')
        .or(`and(participant_a.eq.${user?.id},participant_b.eq.${otherUserId}),and(participant_a.eq.${otherUserId},participant_b.eq.${user?.id})`);

      if (fetchError) throw fetchError;

      let chatId: string;

      if (existingChats && existingChats.length > 0) {
        chatId = existingChats[0].id;
      } else {
        // Create new chat
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert({
            participant_a: user?.id,
            participant_b: otherUserId
          })
          .select()
          .single();

        if (createError) throw createError;
        chatId = newChat.id;
      }

      navigate(`/messages?chat=${chatId}`);
    } catch (error) {
      console.error('Error opening chat:', error);
      toast({
        title: "Error",
        description: "Failed to open chat",
        variant: "destructive",
      });
    }
  };

  const updateCollaborationStatus = async (collabId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('collaborations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', collabId);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // If rejected, remove from list; otherwise update status
      if (newStatus === 'rejected') {
        setCollaborations(prev => prev.filter(collab => collab.id !== collabId));
        toast({
          title: "Success",
          description: "❌ Collaboration declined.",
        });
      } else if (newStatus === 'accepted') {
        setCollaborations(prev =>
          prev.map(collab =>
            collab.id === collabId ? { ...collab, status: newStatus } : collab
          )
        );
        toast({
          title: "Success",
          description: "✅ Collaboration accepted!",
        });
      } else {
        setCollaborations(prev =>
          prev.map(collab =>
            collab.id === collabId ? { ...collab, status: newStatus } : collab
          )
        );
        toast({
          title: "Success",
          description: `Collaboration status updated to ${newStatus}`,
        });
      }
    } catch (error: any) {
      console.error('Error updating collaboration:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update collaboration status",
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
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Collaborations</h1>
          <p className="text-muted-foreground mt-2">
            Manage your active and past collaborations here.
          </p>
        </div>

        {loadingCollabs ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : collaborations.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Collaborations Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start connecting with other creators to see your collaborations here.
              </p>
              <Button onClick={() => navigate('/find-creators')}>
                Find Creators
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {collaborations.map((collab) => {
              const isRequester = collab.requester_id === user.id;
              const otherProfile = isRequester ? collab.receiver_profile : collab.requester_profile;
              const otherUserName = otherProfile?.name || 'Unknown User';

              return (
                <Card key={collab.id} className="hover:shadow-hover transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          {otherProfile?.profile_picture_url ? (
                            <img 
                              src={otherProfile.profile_picture_url} 
                              alt={otherUserName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {collab.title || `Collaboration with ${otherUserName}`}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {isRequester ? 'Requested from' : 'Requested by'} {otherUserName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(collab.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {collab.description && (
                      <p className="text-muted-foreground mb-4">{collab.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDistanceToNow(new Date(collab.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {collab.status === 'pending' && !isRequester && (
                          <>
                            <Button 
                              size="sm"
                              className="bg-success hover:bg-success/90 text-success-foreground"
                              onClick={() => updateCollaborationStatus(collab.id, 'accepted')}
                            >
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => updateCollaborationStatus(collab.id, 'rejected')}
                            >
                              Decline
                            </Button>
                          </>
                        )}
                        {collab.status === 'accepted' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateCollaborationStatus(collab.id, 'completed')}
                          >
                            Mark Complete
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleMessageClick(isRequester ? collab.receiver_id : collab.requester_id)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}