import { motion } from "framer-motion";
import { Check, Zap, Users, Building2, Gift } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const plans = [
  {
    name: "Starter",
    tagline: "For solo service professionals",
    icon: Gift,
    badge: "7-day free trial",
    badgeColor: "bg-green-100 text-green-700 border-green-200",
    price: "1,200",
    priceSuffix: "/month",
    subtext: "Start free for 7 days, no card needed",
    seats: "1 user",
    cta: "Start Free Trial",
    ctaStyle: "border-2 border-border hover:border-primary hover:bg-primary/5 text-foreground",
    cardStyle: "bg-white border border-border",
    dark: false,
    features: [
      "1 staff seat",
      "Unlimited services",
      "Up to 100 bookings/month",
      "Public booking page",
      "WhatsApp reminders",
      "Basic analytics",
      "M-Pesa integration",
      "Email support",
    ],
  },
  {
    name: "Premium",
    tagline: "For growing teams & studios",
    icon: Zap,
    badge: "Most Popular",
    badgeColor: "bg-accent text-accent-foreground",
    price: "5,000",
    priceSuffix: "/month",
    subtext: "Scale your team and bookings",
    seats: "Up to 10 users",
    cta: "Get Premium",
    ctaStyle: "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25",
    cardStyle: "bg-foreground text-white border border-foreground",
    dark: true,
    features: [
      "10 staff seats",
      "Unlimited services & bookings",
      "Custom branded booking page",
      "WhatsApp reminders & broadcasts",
      "Full advanced analytics & reports",
      "Team roles & permissions",
      "M-Pesa + card payments",
      "Priority support",
      "Embeddable widget",
      "Cancellation policy & intake forms",
    ],
  },
  {
    name: "Enterprise",
    tagline: "For agencies & franchises",
    icon: Building2,
    badge: "White-label",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    price: "Custom",
    priceSuffix: "",
    subtext: "Tailored pricing for your scale",
    seats: "Unlimited users",
    cta: "Contact Sales",
    ctaStyle: "border-2 border-border hover:border-primary hover:bg-primary/5 text-foreground",
    cardStyle: "bg-white border border-border",
    dark: false,
    features: [
      "Unlimited staff seats",
      "White-label branding (your logo, domain)",
      "Custom iOS & Android client app",
      "Multi-location management",
      "API access & webhooks",
      "Dedicated account manager",
      "SLA-backed uptime guarantee",
      "Custom integrations",
      "Directory listing (sponsored)",
      "Revenue & commission splits",
    ],
  },
];

export function Pricing() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSelectPlan = (plan: string, cta: string) => {
    if (cta === "Contact Sales") {
      toast({ title: "Let's talk!", description: "Our team will reach out within 24 hours." });
    } else {
      setLocation("/dashboard");
      toast({ title: `${plan} activated`, description: plan === "Starter" ? "Your 7-day free trial has started!" : "Welcome to Nibook!" });
    }
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
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">Pricing</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Grow at your own pace</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start with a free 7-day trial on Starter. No credit card required.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {plans.map((plan, idx) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`relative rounded-3xl p-8 flex flex-col ${plan.cardStyle} shadow-sm`}
              >
                {/* Badge */}
                <div className={`absolute top-0 right-8 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-bold border ${plan.badgeColor}`}>
                  {plan.badge}
                </div>

                {/* Header */}
                <div className="mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${plan.dark ? "bg-white/10" : "bg-primary/10"}`}>
                    <Icon className={`w-5 h-5 ${plan.dark ? "text-white" : "text-primary"}`} />
                  </div>
                  <h3 className={`text-xl font-bold ${plan.dark ? "text-white" : "text-foreground"}`}>{plan.name}</h3>
                  <p className={`text-sm mt-1 ${plan.dark ? "text-white/60" : "text-muted-foreground"}`}>{plan.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    {plan.price !== "Custom" && <span className={`text-sm font-medium ${plan.dark ? "text-white/60" : "text-muted-foreground"}`}>KES</span>}
                    <span className={`text-4xl font-extrabold ${plan.dark ? "text-white" : "text-foreground"}`}>{plan.price}</span>
                    {plan.priceSuffix && <span className={`text-sm ${plan.dark ? "text-white/60" : "text-muted-foreground"}`}>{plan.priceSuffix}</span>}
                  </div>
                  <p className={`text-xs mt-2 ${plan.dark ? "text-white/50" : "text-muted-foreground"}`}>{plan.subtext}</p>
                  <div className={`inline-flex items-center gap-1.5 mt-2 text-xs font-medium px-2 py-1 rounded-full ${plan.dark ? "bg-white/10 text-white/70" : "bg-muted text-muted-foreground"}`}>
                    <Users className="w-3 h-3" />
                    {plan.seats}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <div className={`mt-0.5 rounded-full p-0.5 shrink-0 ${plan.dark ? "bg-accent/20" : "bg-primary/10"}`}>
                        <Check className={`w-3.5 h-3.5 ${plan.dark ? "text-accent" : "text-primary"}`} />
                      </div>
                      <span className={`text-sm leading-snug ${plan.dark ? "text-white/85" : "text-foreground"}`}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSelectPlan(plan.name, plan.cta)}
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground mt-10"
        >
          All plans include M-Pesa support · Cancel anytime · Prices in KES
        </motion.p>
      </div>
    </section>
  );
}
