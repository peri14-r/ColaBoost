import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  Moon, 
  Sun, 
  Menu, 
  X,
  Facebook,
  Twitter,
  Linkedin,
  Github
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { label: 'Features', path: '/features' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'API', path: '/api' },
  { label: 'Integrations', path: '/integrations' },
  { label: 'Company', path: '/company' },
];

const footerLinks = {
  Product: [
    { label: 'Features', path: '/features' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'API', path: '/api' },
    { label: 'Integrations', path: '/integrations' },
  ],
  Company: [
    { label: 'About', path: '/about' },
    { label: 'Blog', path: '/blog' },
    { label: 'Careers', path: '/careers' },
    { label: 'Contact', path: '/contact' },
  ],
  Support: [
    { label: 'Help Center', path: '/help' },
    { label: 'Support', path: '/support' },
    { label: 'Security', path: '/security' },
  ],
  Legal: [
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms of Service', path: '/terms' },
  ],
};

export function MarketingLayout({ children }: MarketingLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip to content link */}
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center space-x-2">
            <img src="/collaboost-logo.png" alt="CollaBoost" className="h-8 w-8 rounded-full" />
            <span className="text-xl font-bold">CollaBoost</span>
          </NavLink>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "text-muted-foreground hover:text-foreground transition-colors",
                    isActive && "text-foreground font-medium"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                Log In
              </Button>
              <Button size="sm" onClick={() => navigate('/auth')}>
                Join Now
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-2">
                    <img src="/collaboost-logo.png" alt="CollaBoost" className="h-6 w-6 rounded-full" />
                    <span className="text-lg font-bold">CollaBoost</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <nav className="flex flex-col space-y-4">
                  {navigationItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "text-muted-foreground hover:text-foreground transition-colors py-2",
                          isActive && "text-foreground font-medium"
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                  
                  <div className="pt-4 border-t border-border space-y-3">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start" 
                      onClick={() => {
                        navigate('/auth');
                        setMobileMenuOpen(false);
                      }}
                    >
                      Log In
                    </Button>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        navigate('/auth');
                        setMobileMenuOpen(false);
                      }}
                    >
                      Join Now
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Logo and description */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <img src="/collaboost-logo.png" alt="CollaBoost" className="h-6 w-6 rounded-full" />
                <span className="text-lg font-bold">CollaBoost</span>
              </div>
              <p className="text-muted-foreground mb-4">
                The ultimate platform for innovators to connect, collaborate, and create breakthrough projects together.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Github className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Footer links */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-semibold mb-4">{category}</h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.path}>
                      <NavLink
                        to={link.path}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 CollaBoost. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <NavLink 
                to="/privacy" 
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Privacy
              </NavLink>
              <NavLink 
                to="/terms" 
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Terms
              </NavLink>
              <NavLink 
                to="/security" 
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Security
              </NavLink>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}