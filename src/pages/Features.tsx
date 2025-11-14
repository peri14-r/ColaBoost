import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { FeaturesSection } from '@/components/FeaturesSection';

export default function Features() {
  return (
    <MarketingLayout>
      <div className="py-8">
        <FeaturesSection />
      </div>
    </MarketingLayout>
  );
}