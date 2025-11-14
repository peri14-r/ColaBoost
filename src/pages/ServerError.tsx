import { MarketingLayout } from "@/components/layout/MarketingLayout";

const ServerError = () => {
  return (
    <MarketingLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold text-center mb-8">500 - Server Error</h1>
          <p className="text-lg text-muted-foreground text-center">Something went wrong on our end.</p>
        </div>
      </div>
    </MarketingLayout>
  );
};

export default ServerError;