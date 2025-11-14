import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  Search, 
  Users, 
  MessageSquare, 
  CreditCard, 
  Settings,
  Layers,
  X,
  Crown,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Search, label: "Find Creators", path: "/find-creators" },
  { icon: Users, label: "My Collabs", path: "/my-collabs" },
  { icon: MessageSquare, label: "Messages", path: "/messages", badge: "2" },
  { icon: CreditCard, label: "Payments", path: "/payments" },
  { icon: Zap, label: "Monetization", path: "/monetization" },
];

interface ResponsiveSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResponsiveSidebar({ isOpen, onClose }: ResponsiveSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <img src="/collaboost-logo.png" alt="CollaBoost" className="h-6 w-6 rounded-full" />
          <span className="text-lg font-bold bg-gradient-hero bg-clip-text text-transparent">
            CollaBoost
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="md:hidden h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose()}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="h-5 text-xs">
                  {item.badge}
                </Badge>
              )}
            </NavLink>
          ))}
        </div>

        <div className="mt-8 space-y-2">
          <NavLink
            to="/settings"
            onClick={() => onClose()}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <Settings className="h-4 w-4" />
            Settings
          </NavLink>
        </div>
      </nav>

      {/* Upgrade Card */}
      <div className="p-4 border-t">
        <div className="bg-gradient-card rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Upgrade to Pro</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Get 20 requests/month, verified badge & profile boost.
          </p>
          <Button size="sm" className="w-full" variant="hero" onClick={() => { onClose(); navigate('/payments'); }}>
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-card border-r shadow-lg transform transition-transform duration-300 ease-in-out">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}