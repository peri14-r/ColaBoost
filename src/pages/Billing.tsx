import { AppLayout } from '@/components/layout/AppLayout';

export default function Billing() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information.
        </p>
      </div>
    </AppLayout>
  );
}