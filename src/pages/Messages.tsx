import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Paperclip, Menu, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { z } from 'zod';
import { cn } from "@/lib/utils";

// Validation schema for messages
const messageSchema = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty').max(5000, 'Message must be less than 5000 characters')
});

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string;
  attachment_url?: string;
  created_at: string;
  read_at?: string;
}

interface Chat {
  id: string;
  participant_a: string;
  participant_b: string;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatListVisible, setChatListVisible] = useState(true);

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  // Handle chat parameter from URL
  useEffect(() => {
    const chatId = searchParams.get('chat');
    if (chatId) {
      setSelectedChat(chatId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
      
      // Subscribe to real-time messages
      const channel = supabase
        .channel('messages-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${selectedChat}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedChat]);

  const loadChats = async () => {
    try {
      // SECURITY NOTE: This template literal is safe because user.id comes from auth.uid()
      // which returns a validated UUID. NEVER use template literals with user-controlled input!
      const { data: chatsData, error } = await supabase
        .from('chats')
        .select('*')
        .or(`participant_a.eq.${user?.id},participant_b.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (chatsData) {
        setChats(chatsData);
        
        // Load profiles for all participants
        const participantIds = chatsData.flatMap(chat => [chat.participant_a, chat.participant_b]);
        const uniqueIds = [...new Set(participantIds)];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', uniqueIds);

        if (profilesError) throw profilesError;

        if (profilesData) {
          const profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {} as Record<string, Profile>);
          setProfiles(profilesMap);
        }
      }
    } catch (error: any) {
      console.error('Error loading chats:', error);
      toast({
        title: "Error",
        description: "Failed to load chats",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (messagesData) {
        setMessages(messagesData);
      }
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    try {
      // Validate message
      const validatedMessage = messageSchema.parse({ body: newMessage.trim() });
      
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat,
          sender_id: user.id,
          body: validatedMessage.body
        });

      if (error) throw error;

      setNewMessage("");
      loadMessages(selectedChat);
      
      toast({
        title: "Success",
        description: "Message sent successfully"
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        });
      }
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    const otherUserId = chat.participant_a === user?.id ? chat.participant_b : chat.participant_a;
    return profiles[otherUserId];
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChat(chatId);
    setChatListVisible(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Loading Messages...</h2>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-4rem)] relative">
        {/* Chat List Sidebar */}
        <div className={cn(
          "border-r border-border flex flex-col bg-card transition-all duration-300 absolute lg:relative h-full z-10 overflow-hidden",
          chatListVisible ? "w-80 left-0" : "w-0 -left-80 lg:w-80 lg:left-0"
        )}>
          <div className={cn(
            "p-4 border-b border-border transition-opacity",
            !chatListVisible && "opacity-0 lg:opacity-100"
          )}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Messages</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setChatListVisible(false)}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className={cn(
            "flex-1 overflow-y-auto transition-opacity",
            !chatListVisible && "opacity-0 lg:opacity-100"
          )}>
            {chats.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              chats.map((chat) => {
                const otherParticipant = getOtherParticipant(chat);
                return (
                  <div
                    key={chat.id}
                    onClick={() => handleChatSelect(chat.id)}
                    className={cn(
                      "flex items-center gap-3 p-4 hover:bg-accent cursor-pointer transition-colors",
                      selectedChat === chat.id && "bg-accent"
                    )}
                  >
                    <Avatar>
                      <AvatarImage src={otherParticipant?.avatar_url} />
                      <AvatarFallback>
                        {otherParticipant?.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {otherParticipant?.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(chat.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedChat ? (
            <>
              {/* Messages Header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setChatListVisible(true)}
                  className={cn(!chatListVisible ? "flex" : "hidden lg:flex")}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                  {(() => {
                    const chat = chats.find(c => c.id === selectedChat);
                    const otherParticipant = chat ? getOtherParticipant(chat) : null;
                    return (
                      <>
                        <Avatar>
                          <AvatarImage src={otherParticipant?.avatar_url} />
                          <AvatarFallback>
                            {otherParticipant?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold">
                          {otherParticipant?.name || 'Unknown User'}
                        </h3>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.sender_id === user?.id ? "justify-end" : "justify-start"
                    )}
                  >
                    <Card className={cn(
                      "max-w-[70%] shadow-sm",
                      message.sender_id === user?.id 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-card"
                    )}>
                      <CardContent className="p-3">
                        <p className="text-sm break-words">{message.body}</p>
                        <p className={cn(
                          "text-xs mt-1",
                          message.sender_id === user?.id 
                            ? "text-primary-foreground/70" 
                            : "text-muted-foreground"
                        )}>
                          {formatTime(message.created_at)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p>Choose a chat from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}