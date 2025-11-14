import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Home, 
  Search, 
  MessageSquare, 
  Handshake, 
  CreditCard, 
  User, 
  LogOut,
  Crown,
  Zap
} from 'lucide-react';

const menuItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Search, label: 'Find Creators', path: '/find-creators' },
  { icon: Handshake, label: 'My Collabs', path: '/my-collabs' },
  { icon: MessageSquare, label: 'Messages', path: '/messages' },
  { icon: CreditCard, label: 'Payments', path: '/payments' },
  { icon: Zap, label: 'Monetization', path: '/monetization' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-primary p-2 rounded-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            CreatorCollab
          </span>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Button
              key={item.path}
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                isActive ? 'bg-gradient-card text-primary' : ''
              }`}
              onClick={() => navigate(item.path)}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Pro Upgrade Banner */}
      <div className="p-4 m-4 bg-gradient-card rounded-lg border">
        <div className="flex items-center space-x-2 mb-2">
          <Crown className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Upgrade to Pro</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Get 20 requests/month, verified badge & profile boost
        </p>
        <Button size="sm" variant="hero" className="w-full" onClick={() => navigate('/payments')}>
          Upgrade Now
        </Button>
      </div>

      {/* Sign Out */}
      <div className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}