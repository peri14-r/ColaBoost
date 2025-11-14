import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for getting started with creator networking",
    features: [
      "Create detailed profile",
      "Browse creator directory", 
      "Send up to 3 collaboration requests",
      "Basic messaging",
      "Community access"
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline" as const,
    popular: false
  },
  {
    name: "Pro",
    price: "29",
    description: "Everything you need for serious creator collaboration",
    features: [
      "Everything in Free",
      "Up to 20 collaboration requests per month",
      "1 monthly profile boost",
      "Priority listing in creator search",
      "Verified badge",
      "Advanced search filters",
      "Analytics dashboard",
      "Premium support",
      "Early access to new features"
    ],
    buttonText: "Upgrade to Pro",
    buttonVariant: "hero" as const,
    popular: true
  }
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            Simple{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            Start free and upgrade when you're ready to unlock the full potential of creator collaboration.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={plan.name}
              className={`relative bg-card border rounded-2xl p-8 shadow-card hover:shadow-hover transition-all duration-300 ${
                plan.popular ? 'ring-2 ring-primary scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-hero text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2 text-foreground">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-foreground/60">/month</span>
                </div>
                <p className="text-foreground/70">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-1">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.buttonVariant} 
                size="lg" 
                className="w-full"
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}