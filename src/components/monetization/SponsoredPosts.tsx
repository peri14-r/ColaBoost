import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface SponsoredPost {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string;
  display_order: number;
}

interface SponsoredPostsProps {
  limit?: number;
  variant?: 'default' | 'sidebar';
}

export function SponsoredPosts({ limit = 3, variant = 'default' }: SponsoredPostsProps) {
  const [posts, setPosts] = useState<SponsoredPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSponsoredPosts();
  }, [limit]);

  const fetchSponsoredPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('sponsored_posts')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(limit);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching sponsored posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (posts.length === 0) return null;

  if (variant === 'sidebar') {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-primary dark:text-black" />
          <h3 className="text-sm font-semibold">Promoted Tools</h3>
        </div>
        {posts.map((post) => (
          <Card key={post.id} className="p-4 hover:shadow-md transition-shadow">
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-24 object-cover rounded-md mb-3"
              />
            )}
            <h4 className="font-medium text-sm mb-1">{post.title}</h4>
            {post.description && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {post.description}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open(post.link_url, '_blank', 'noopener,noreferrer')}
            >
              Learn More
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Sparkles className="h-5 w-5 text-primary dark:text-black" />
        <h2 className="text-xl font-bold">Brand Spotlight</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-glow transition-shadow">
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="font-semibold mb-2">{post.title}</h3>
              {post.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {post.description}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open(post.link_url, '_blank', 'noopener,noreferrer')}
              >
                Learn More
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
