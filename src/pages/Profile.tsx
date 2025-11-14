import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Save, Camera, Instagram, Youtube, Music, Crown } from 'lucide-react';
import { z } from 'zod';

// Validation schema for profile data
const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  bio: z.string().trim().max(500, 'Bio must be less than 500 characters').optional(),
  niche: z.string().max(50, 'Niche must be less than 50 characters').optional(),
  instagram_url: z.union([z.string().url('Invalid Instagram URL').max(255), z.literal('')]).optional(),
  youtube_url: z.union([z.string().url('Invalid YouTube URL').max(255), z.literal('')]).optional(),
  tiktok_url: z.union([z.string().url('Invalid TikTok URL').max(255), z.literal('')]).optional(),
  follower_count: z.number().int().min(0, 'Follower count must be positive').max(1000000000, 'Follower count too large'),
  profile_picture_url: z.union([z.string().url('Invalid profile picture URL').max(500), z.literal('')]).optional()
});

interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  bio: string | null;
  niche: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  follower_count: number;
  profile_picture_url: string | null;
  role: string | null;
}

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    niche: '',
    instagram_url: '',
    youtube_url: '',
    tiktok_url: '',
    follower_count: 0,
    profile_picture_url: ''
  });

  const niches = [
    'Tech', 'Fashion', 'Food', 'Travel', 'Fitness', 'Beauty', 
    'Gaming', 'Music', 'Art', 'Business', 'Education', 'Health',
    'Lifestyle', 'Sports', 'Entertainment', 'Photography'
  ];

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProfile(data);
        setFormData({
          name: data.name || '',
          bio: data.bio || '',
          niche: data.niche || '',
          instagram_url: data.instagram_url || '',
          youtube_url: data.youtube_url || '',
          tiktok_url: data.tiktok_url || '',
          follower_count: data.follower_count || 0,
          profile_picture_url: data.profile_picture_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or WEBP image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5242880) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      // Update form data with new URL
      setFormData(prev => ({ ...prev, profile_picture_url: publicUrl }));

      toast({
        title: "Success",
        description: "Profile picture uploaded! Don't forget to save changes.",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Validate form data
      const validatedData = profileSchema.parse(formData);
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...validatedData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      await fetchProfile();
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
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
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile information and social media links
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Preview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Profile Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {loadingProfile ? (
              <div className="space-y-4">
                <div className="h-20 w-20 bg-muted animate-pulse rounded-full mx-auto"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4 mx-auto"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-1/2 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                    <AvatarImage src={formData.profile_picture_url || undefined} />
                    <AvatarFallback className="bg-gradient-primary text-white dark:text-black text-xl">
                      {formData.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    id="profile-picture-upload"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    onClick={() => document.getElementById('profile-picture-upload')?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg">
                    {formData.name || 'Your Name'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>

                {formData.niche && (
                  <Badge variant="secondary">
                    {formData.niche}
                  </Badge>
                )}

                {profile?.role === 'pro' && (
                  <Badge className="bg-gradient-primary text-white dark:text-black">
                    <Crown className="mr-1 h-3 w-3" />
                    Pro Member
                  </Badge>
                )}

                {formData.bio && (
                  <p className="text-sm text-muted-foreground">
                    {formData.bio}
                  </p>
                )}

                <div className="text-center">
                  <p className="text-lg font-semibold">
                    {formData.follower_count.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="niche">Niche</Label>
                <Select 
                  value={formData.niche} 
                  onValueChange={(value) => handleInputChange('niche', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your niche" />
                  </SelectTrigger>
                  <SelectContent>
                    {niches.map(niche => (
                      <SelectItem key={niche} value={niche}>
                        {niche}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell others about yourself..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="follower_count">Follower Count</Label>
              <Input
                id="follower_count"
                type="number"
                value={formData.follower_count}
                onChange={(e) => handleInputChange('follower_count', parseInt(e.target.value) || 0)}
                placeholder="Total followers across platforms"
              />
            </div>

            <div className="space-y-4">
              <Label>Social Media Links</Label>
              
              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center text-sm">
                  <Instagram className="mr-2 h-4 w-4" />
                  Instagram URL
                </Label>
                <Input
                  id="instagram"
                  value={formData.instagram_url}
                  onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube" className="flex items-center text-sm">
                  <Youtube className="mr-2 h-4 w-4" />
                  YouTube URL
                </Label>
                <Input
                  id="youtube"
                  value={formData.youtube_url}
                  onChange={(e) => handleInputChange('youtube_url', e.target.value)}
                  placeholder="https://youtube.com/@yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok" className="flex items-center text-sm">
                  <Music className="mr-2 h-4 w-4" />
                  TikTok URL
                </Label>
                <Input
                  id="tiktok"
                  value={formData.tiktok_url}
                  onChange={(e) => handleInputChange('tiktok_url', e.target.value)}
                  placeholder="https://tiktok.com/@yourusername"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile_picture">Profile Picture URL</Label>
              <Input
                id="profile_picture"
                value={formData.profile_picture_url}
                onChange={(e) => handleInputChange('profile_picture_url', e.target.value)}
                placeholder="https://example.com/your-photo.jpg"
              />
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full"
              variant="hero"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}