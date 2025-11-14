import { UserPlus, Search, MessageSquare, Trophy } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Create Your Profile",
    description: "Sign up and showcase your content, niche, and collaboration goals with a detailed creator profile."
  },
  {
    icon: Search,
    number: "02", 
    title: "Discover Creators",
    description: "Use our smart filters to find creators who match your audience, style, and collaboration preferences."
  },
  {
    icon: MessageSquare,
    number: "03",
    title: "Start Collaborating",
    description: "Send collaboration requests, chat with matched creators, and plan your next viral project together."
  },
  {
    icon: Trophy,
    number: "04",
    title: "Grow Together",
    description: "Execute amazing collaborations, track your success, and build lasting creator relationships."
  }
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            How It{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Getting started with CreatorCollab is simple. Follow these four easy steps to begin your collaboration journey.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="text-center group">
              <div className="relative mb-8">
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-primary to-transparent transform -translate-y-1/2 z-0" />
                )}
                
                {/* Icon container */}
                <div className="relative bg-gradient-primary p-6 rounded-2xl w-20 h-20 mx-auto flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300 z-10">
                  <step.icon className="h-8 w-8 text-white dark:text-black" />
                </div>
                
                {/* Step number */}
                <div className="absolute -top-2 -right-2 bg-card border-2 border-background rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold text-primary shadow-card">
                  {step.number}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}