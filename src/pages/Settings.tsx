import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Trash2, 
  Upload,
  Mail,
  MessageSquare,
  Users,
  Crown,
  Eye,
  EyeOff
} from 'lucide-react';

const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  bio: z.string().trim().max(500, 'Bio must be less than 500 characters'),
  location: z.string().trim().max(100, 'Location must be less than 100 characters'),
  avatarUrl: z.union([z.string().url('Invalid URL').max(500), z.literal('')])
});

export default function Settings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Profile settings state
  const [profileData, setProfileData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    bio: '',
    website: '',
    location: '',
    avatarUrl: user?.user_metadata?.avatar_url || ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Notification settings state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    collabRequests: true,
    messages: true,
    updates: false,
    marketing: false
  });

  // Password change dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      setProfileData(prev => ({ ...prev, avatarUrl: publicUrl }));

      // Immediately save to database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "✅ Profile photo updated successfully!",
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Validate profile data
      const validated = profileUpdateSchema.parse({
        fullName: profileData.fullName,
        bio: profileData.bio,
        location: profileData.location,
        avatarUrl: profileData.avatarUrl
      });

      const { error } = await supabase
        .from('profiles')
        .update({
          name: validated.fullName,
          bio: validated.bio,
          location: validated.location,
          profile_picture_url: validated.avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        // Handle validation errors
        const firstError = error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
      } else {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to update profile",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);
    // Add notification update logic here
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Success",
        description: "Notification settings updated",
      });
    }, 1000);
  };

  const handleChangePassword = async () => {
    setLoading(true);
    setPasswordErrors({});
    
    try {
      // Validate password with zod
      const validated = passwordSchema.parse(passwordData);

      const { error } = await supabase.auth.updateUser({
        password: validated.newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password changed successfully. Please log in again.",
      });
      
      // Reset form and close dialog
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setPasswordDialogOpen(false);
      
      // Log out after password change
      await signOut();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        // Handle validation errors
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setPasswordErrors(errors);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to change password",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadData = async () => {
    setLoading(true);
    try {
      if (!user) return;

      // Fetch all user data
      const [profileData, collabsData, messagesData] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('collaborations').select('*').or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`),
        supabase.from('messages').select('*').eq('sender_id', user.id)
      ]);

      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        profile: profileData.data,
        collaborations: collabsData.data,
        messages: messagesData.data
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `collaboost-data-${new Date().toISOString()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Your data has been downloaded",
      });
    } catch (error: any) {
      console.error('Error downloading data:', error);
      toast({
        title: "Error",
        description: "Failed to download data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setLoading(true);
      try {
        // Note: Account deletion should be handled by a backend function
        // For now, we'll just sign out
        toast({
          title: "Contact Support",
          description: "Please contact support to delete your account.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile information and how others see you on CollaBoost
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profileData.avatarUrl} alt="Profile" />
                    <AvatarFallback className="text-lg">
                      {user?.email ? getInitials(user.email) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <input
                      type="file"
                      id="avatar-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={uploadingImage}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or WEBP. Max size 5MB.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        placeholder="https://your-website.com"
                        value={profileData.website}
                        onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="City, Country"
                        value={profileData.location}
                        onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleProfileUpdate} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified about activity on CollaBoost
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Collaboration Requests</p>
                        <p className="text-sm text-muted-foreground">Get notified when someone wants to collaborate</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.collabRequests}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, collabRequests: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Messages</p>
                        <p className="text-sm text-muted-foreground">Get notified about new messages</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.messages}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, messages: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Product Updates</p>
                        <p className="text-sm text-muted-foreground">Get notified about new features and updates</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.updates}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, updates: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Crown className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Marketing & Tips</p>
                        <p className="text-sm text-muted-foreground">Receive tips and promotional content</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.marketing}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, marketing: checked }))}
                    />
                  </div>
                </div>

                <Button onClick={handleNotificationUpdate} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Settings */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Subscription</CardTitle>
                <CardDescription>
                  Manage your subscription and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Current Plan</p>
                    <p className="text-sm text-muted-foreground">Free Plan</p>
                  </div>
                  <Badge variant="secondary">Free</Badge>
                </div>

                <div className="bg-gradient-card rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Upgrade to Pro</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get 20 collaboration requests/month, 1 monthly profile boost, verified badge, and priority listing for just $29/month.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Pro features include:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Up to 20 collaboration requests per month</li>
                      <li>• 1 monthly profile boost</li>
                      <li>• Priority listing in creator search</li>
                      <li>• Verified badge</li>
                      <li>• Advanced search filters</li>
                      <li>• Analytics dashboard</li>
                      <li>• Premium support</li>
                    </ul>
                  </div>
                  <Button variant="hero">
                    Upgrade to Pro - $29/month
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>
                  Manage your account security and data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Button 
                    variant="outline"
                    onClick={() => setPasswordDialogOpen(true)}
                    disabled={loading}
                  >
                    Change Password
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleDownloadData}
                    disabled={loading}
                  >
                    {loading ? 'Downloading...' : 'Download My Data'}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-destructive">Danger Zone</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {loading ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Password Change Dialog */}
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Create a strong password with at least 8 characters, including uppercase, lowercase, and numbers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className={passwordErrors.newPassword ? "border-destructive" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={passwordErrors.confirmPassword ? "border-destructive" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium mb-2">Password Requirements:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• At least 8 characters long</li>
                  <li>• Contains uppercase letter (A-Z)</li>
                  <li>• Contains lowercase letter (a-z)</li>
                  <li>• Contains number (0-9)</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setPasswordDialogOpen(false);
                  setPasswordData({ newPassword: '', confirmPassword: '' });
                  setPasswordErrors({});
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}