import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { PricingSection } from "@/components/PricingSection";
import { SponsoredPosts } from "@/components/monetization/SponsoredPosts";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <div className="container mx-auto px-4 py-16">
          <SponsoredPosts limit={3} />
        </div>
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
