import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Pricing() {
  const { toast } = useToast();

  const handleSelectPlan = (plan: string) => {
    toast({
      title: `${plan} Selected`,
      description: "Taking you to the signup page...",
    });
  };

  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Simple, honest pricing</h2>
          <p className="mt-4 text-lg text-muted-foreground">Start for free, upgrade when you need more power.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 border border-border shadow-sm flex flex-col"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">Free</h3>
              <p className="text-muted-foreground">Perfect for just getting started.</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-foreground">KES 0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {[
                "Up to 3 services",
                "10 bookings per month",
                "Public booking page",
                "Basic analytics dashboard"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-full p-1">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handleSelectPlan("Free Plan")}
              className="w-full py-4 rounded-xl font-bold border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors text-foreground"
            >
              Get Started Free
            </button>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-foreground text-white rounded-3xl p-8 border border-foreground shadow-2xl relative flex flex-col"
          >
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-bold shadow-lg">
              Most Popular
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-white/70">For growing businesses and teams.</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">KES 1,500</span>
                <span className="text-white/70">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {[
                "Unlimited services & bookings",
                "Custom branding on booking page",
                "Automatic WhatsApp reminders",
                "Team management (up to 3 seats)",
                "M-Pesa payment integration",
                "Full advanced analytics",
                "Priority support"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="bg-accent/20 rounded-full p-1">
                    <Check className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-white/90">{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handleSelectPlan("Pro Plan")}
              className="w-full py-4 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
            >
              Upgrade to Pro
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
