import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { PricingSection } from '@/components/PricingSection';

export default function Pricing() {
  return (
    <MarketingLayout>
      <div className="py-8">
        <PricingSection />
      </div>
    </MarketingLayout>
  );
}