import { Users, MessageSquare, Search, Shield, CreditCard, Zap } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Smart Matching",
    description: "Find creators that perfectly align with your niche, audience size, and collaboration goals."
  },
  {
    icon: MessageSquare,
    title: "Seamless Communication",
    description: "Built-in messaging system for accepted collaborations with project management tools."
  },
  {
    icon: Search,
    title: "Advanced Filters",
    description: "Search by niche, follower count, location, and collaboration preferences to find your ideal partner."
  },
  {
    icon: Shield,
    title: "Verified Profiles",
    description: "All creators are verified with authentic social media metrics and portfolio validation."
  },
  {
    icon: CreditCard,
    title: "Flexible Pricing",
    description: "Free tier with 3 requests/month, Pro tier with 20 requests/month plus verified badge and profile boost."
  },
  {
    icon: Zap,
    title: "Fast Connections",
    description: "Send collaboration requests instantly and get responses within 24 hours on average."
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Collaborate
            </span>
          </h2>
          <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
            Powerful tools and features designed to make creator collaboration effortless and successful.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="bg-card border rounded-2xl p-8 shadow-card hover:shadow-hover transition-all duration-300 group hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="bg-gradient-primary p-3 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-6 w-6 text-white dark:text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-foreground/70 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}