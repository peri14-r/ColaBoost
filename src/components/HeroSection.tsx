import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Users, MessageSquare, Star } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-subtle opacity-50" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left space-y-8 animate-fade-in px-2">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight text-foreground">
                Small Creators.{" "}
                <span className="font-bold text-primary">
                  Big Growth.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto lg:mx-0">
                Find collabs that grow you. Connect with creators who share your vision, 
                collaborate on projects that matter, and watch your audience grow.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start w-full px-4">
              <Button variant="hero" size="lg" className="group w-auto mx-auto sm:mx-0" onClick={() => window.location.href = '/auth'}>
                Start Growing
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" className="group w-auto mx-auto sm:mx-0">
                <Play className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                See How It Works
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-8 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">10K+</div>
                <div className="text-sm text-foreground/60">Growing Creators</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">5K+</div>
                <div className="text-sm text-foreground/60">Success Stories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">99%</div>
                <div className="text-sm text-foreground/60">Growth Rate</div>
              </div>
            </div>
          </div>

          {/* Right content - Hero image */}
          <div className="relative lg:pl-8 animate-scale-in">
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Creators collaborating together" 
                className="w-full h-auto rounded-2xl shadow-glow"
              />
              
              {/* Floating elements */}
              <div className="absolute -top-4 -left-4 bg-card border shadow-card rounded-xl p-3 animate-float">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-card border shadow-card rounded-xl p-3 animate-float" style={{ animationDelay: '2s' }}>
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div className="absolute top-1/2 -right-4 bg-card border shadow-card rounded-xl p-3 animate-float" style={{ animationDelay: '4s' }}>
                <Star className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}