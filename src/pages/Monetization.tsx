import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { CreatorTools } from '@/components/monetization/CreatorTools';
import { SponsoredPosts } from '@/components/monetization/SponsoredPosts';
import { ProfileBoostButton } from '@/components/monetization/ProfileBoostButton';
import { DollarSign, Rocket, TrendingUp, Zap } from 'lucide-react';

export default function Monetization() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center space-x-2 mb-4">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Monetization Hub
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Turn your collaborations into revenue. Discover powerful tools and features to grow your creator business.
          </p>
        </div>

        {/* Section 1: Affiliate Tools */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Affiliate Tools</h2>
              <p className="text-muted-foreground mt-1">
                Earn commissions by sharing tools you already love and use in your content creation workflow
              </p>
            </div>
          </div>
          <CreatorTools />
        </section>

        {/* Section 2: Sponsored Posts */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Sponsored Posts</h2>
              <p className="text-muted-foreground mt-1">
                Partner with brands and get featured on CollaBoost. Showcase your expertise while earning additional income through brand collaborations
              </p>
            </div>
          </div>
          <SponsoredPosts limit={3} />
        </section>

        {/* Section 3: Profile Boost */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Profile Boost</h2>
              <p className="text-muted-foreground mt-1">
                Get featured at the top of search results for 7 days. Increase your visibility and attract more collaboration opportunities
              </p>
            </div>
          </div>
          <Card className="p-8 bg-gradient-card border-2">
            <div className="max-w-3xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Stand Out from the Crowd</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Priority placement in creator search results</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>7 days of increased visibility</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Attract more collaboration requests</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Grow your creator network faster</span>
                    </li>
                  </ul>
                </div>
                <div className="text-center">
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-primary">$10</span>
                    <span className="text-muted-foreground ml-2">/ 7 days</span>
                  </div>
                  <ProfileBoostButton />
                  <p className="text-sm text-muted-foreground mt-4">
                    Pro members get 1 free boost per month
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
