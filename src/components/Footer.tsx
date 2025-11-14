import { Layers, Twitter, Instagram, Youtube, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <img src="/collaboost-logo.png" alt="CollaBoost" className="h-8 w-8 rounded-full" />
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              CollaBoost
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Forge connections, create innovation, and collaborate with visionary minds in our unified digital workspace.
          </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Creator Tools */}
          <div>
            <h4 className="font-semibold mb-4">Creator Tools</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://partner.canva.com/c/5428916/647168/10068" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Canva Pro</a></li>
              <li><a href="https://www.capcut.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">CapCut</a></li>
              <li><a href="https://affiliate.notion.so/sdzpnmztzqy4" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Notion</a></li>
              <li><a href="https://www.epidemicsound.com/referral/i3t5dy/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Epidemic Sound</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/help" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="/security" className="hover:text-primary transition-colors">Security</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 mt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 CollaBoost. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}