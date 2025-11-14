import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        // Check if user has admin role using the has_role() function
        const { data, error } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });

        if (error) throw error;

        if (!data) {
          // User is not an admin, redirect to dashboard
          navigate('/dashboard');
        } else {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        navigate('/dashboard');
      } finally {
        setChecking(false);
      }
    };

    if (!loading) {
      checkAdminRole();
    }
  }, [user, loading, navigate]);

  if (loading || checking) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Administrative tools and diagnostics.
          </p>
        </div>

        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-900 dark:text-amber-500">
              <ShieldAlert className="mr-2 h-5 w-5" />
              Admin Access Protected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This page is protected by server-side role checks. Only users with the 'admin' role in the user_roles table can access this page.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              To grant admin access, an existing admin must add a record to the user_roles table via Supabase SQL Editor.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}