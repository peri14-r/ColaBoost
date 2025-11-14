import { Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { useNavigate } from 'react-router-dom';

export function DashboardHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="header-black flex items-center justify-between px-6 h-16">
      <div className="flex-1" />
      
      <div className="flex items-center space-x-4">
        <NotificationDropdown />
        
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <Settings className="h-4 w-4" />
        </Button>
        
        <Avatar className="h-8 w-8">
          <AvatarImage src="" />
          <AvatarFallback className="bg-gradient-primary text-white dark:text-black text-sm">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}