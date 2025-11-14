import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Handshake } from 'lucide-react';
import { VerifiedBadge } from '@/components/ui/verified-badge';

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

interface CreatorCardProps {
  profile: Profile;
  onCollabRequest: () => void;
  viewMode?: 'grid' | 'list';
}

export function CreatorCard({ profile, onCollabRequest, viewMode = 'grid' }: CreatorCardProps) {
  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const isPro = profile.subscription_type === 'pro';

  return (
    <Card className="hover:shadow-hover transition-all duration-300 hover:-translate-y-1 group">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-16 w-16 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
            <AvatarImage src={profile.profile_picture_url || undefined} />
            <AvatarFallback className="bg-gradient-primary text-white dark:text-black text-lg">
              {profile.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1">
              <h3 className="font-semibold text-lg">{profile.name || 'Anonymous Creator'}</h3>
              {isPro && <VerifiedBadge size="sm" />}
            </div>
            {profile.niche && (
              <Badge variant="secondary" className="text-xs">
                {profile.niche}
              </Badge>
            )}
          </div>
          
          {profile.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {profile.bio}
            </p>
          )}
          
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{formatFollowerCount(profile.follower_count)} followers</span>
          </div>
          
          <Button 
            variant="hero" 
            size="sm" 
            className="w-full group-hover:scale-105 transition-transform"
            onClick={onCollabRequest}
          >
            <Handshake className="mr-2 h-4 w-4" />
            Request Collab
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}