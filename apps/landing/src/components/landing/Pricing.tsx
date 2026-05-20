import { motion, AnimatePresence } from "framer-motion";
import { Check, Zap, Users, Gift, Mail, Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

const STARTER_PLAN_CODE = import.meta.env.VITE_PAYSTACK_STARTER_PLAN_CODE as string | undefined;
const PREMIUM_PLAN_CODE = import.meta.env.VITE_PAYSTACK_PREMIUM_PLAN_CODE as string | undefined;

const plans = [
  {
    name: "Starter",
    tagline: "For solo service professionals",
    icon: Gift,
    badge: "7-day free trial",
    badgeColor: "bg-green-100 text-green-700 border-green-200",
    price: "1,200",
    amount: 1200,
    priceSuffix: "/month",
    subtext: "Start free for 7 days, no card needed",
    seats: "1 user",
    cta: "Start Free Trial",
    isTrial: true,
    planCode: STARTER_PLAN_CODE,
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
    amount: 5000,
    priceSuffix: "/month",
    subtext: "Scale your team and bookings",
    seats: "Up to 10 users",
    cta: "Get Premium",
    isTrial: false,
    planCode: PREMIUM_PLAN_CODE,
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
];

type PayStep = "idle" | "email" | "redirecting";

interface PayState {
  plan: typeof plans[0] | null;
  email: string;
  step: PayStep;
}

export function Pricing() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [pay, setPay] = useState<PayState>({ plan: null, email: "", step: "idle" });

  function openPayModal(plan: typeof plans[0]) {
    if (plan.cta === "Contact Sales") {
      toast({ title: "Let's talk!", description: "Our team will reach out within 24 hours." });
      return;
    }
    if (plan.isTrial) {
      setLocation("/dashboard");
      toast({ title: "Trial started!", description: "Your 7-day free trial has begun — no card needed." });
      return;
    }

    // If already logged in, skip email step
    if (user?.email) {
      setPay({ plan, email: user.email, step: "email" });
    } else {
      setPay({ plan, email: "", step: "email" });
    }
  }

  function closePay() {
    setPay({ plan: null, email: "", step: "idle" });
  }

  async function redirectToPaystack() {
    if (!pay.plan || !pay.email.trim()) return;

    if (!pay.plan.planCode) {
      toast({
        title: "Not configured",
        description: "Payment plans are not yet configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    setPay(s => ({ ...s, step: "redirecting" }));

    try {
      const res = await fetch("/api/subscriptions/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pay.email.trim(),
          plan_code: pay.plan.planCode,
          owner_id: user?.id ?? undefined,
        }),
      });

      const data = await res.json() as {
        success: boolean;
        authorization_url?: string;
        message?: string;
      };

      if (!res.ok || !data.success || !data.authorization_url) {
        toast({
          title: "Something went wrong",
          description: data.message ?? "Could not start checkout. Please try again.",
          variant: "destructive",
        });
        setPay(s => ({ ...s, step: "email" }));
        return;
      }

      // Redirect to Paystack hosted checkout
      window.location.href = data.authorization_url;
    } catch {
      toast({
        title: "Network error",
        description: "Could not reach the payment server. Please try again.",
        variant: "destructive",
      });
      setPay(s => ({ ...s, step: "email" }));
    }
  }

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
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Simple, honest pricing</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free for 7 days — no credit card, no commitment. Upgrade when you're ready.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
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
                <div className={`absolute top-0 right-8 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-bold border ${plan.badgeColor}`}>
                  {plan.badge}
                </div>

                <div className="mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${plan.dark ? "bg-white/10" : "bg-primary/10"}`}>
                    <Icon className={`w-5 h-5 ${plan.dark ? "text-white" : "text-primary"}`} />
                  </div>
                  <h3 className={`text-xl font-bold ${plan.dark ? "text-white" : "text-foreground"}`}>{plan.name}</h3>
                  <p className={`text-sm mt-1 ${plan.dark ? "text-white/60" : "text-muted-foreground"}`}>{plan.tagline}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    {plan.price !== "Custom" && (
                      <span className={`text-sm font-medium ${plan.dark ? "text-white/60" : "text-muted-foreground"}`}>KES</span>
                    )}
                    <span className={`text-4xl font-extrabold ${plan.dark ? "text-white" : "text-foreground"}`}>{plan.price}</span>
                    {plan.priceSuffix && (
                      <span className={`text-sm ${plan.dark ? "text-white/60" : "text-muted-foreground"}`}>{plan.priceSuffix}</span>
                    )}
                  </div>
                  <p className={`text-xs mt-2 ${plan.dark ? "text-white/50" : "text-muted-foreground"}`}>{plan.subtext}</p>
                  <div className={`inline-flex items-center gap-1.5 mt-2 text-xs font-medium px-2 py-1 rounded-full ${plan.dark ? "bg-white/10 text-white/70" : "bg-muted text-muted-foreground"}`}>
                    <Users className="w-3 h-3" />
                    {plan.seats}
                  </div>
                </div>

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

                <button
                  onClick={() => openPayModal(plan)}
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground mt-10"
        >
          All plans include M-Pesa support · Cancel anytime · Prices in KES · Secure checkout via Paystack
        </motion.p>
      </div>

      {/* ── Paystack Checkout Dialog ── */}
      <Dialog open={pay.step !== "idle"} onOpenChange={open => { if (!open) closePay(); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              Subscribe to {pay.plan?.name}
            </DialogTitle>
            <DialogDescription>
              {pay.plan && (
                <span>KES {pay.plan.price}/month · Billed monthly · Cancel anytime</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {pay.step === "email" && (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                  You'll be redirected to Paystack's secure checkout to complete your subscription.
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email address</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={pay.email}
                    onChange={e => setPay(s => ({ ...s, email: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter") redirectToPaystack(); }}
                    disabled={!!user?.email}
                  />
                  {user?.email && (
                    <p className="text-xs text-muted-foreground mt-1">Using your account email</p>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl text-sm">
                  <span className="text-muted-foreground">Total today</span>
                  <span className="font-bold text-foreground">KES {pay.plan?.price}/month</span>
                </div>

                <Button
                  className="w-full"
                  onClick={redirectToPaystack}
                  disabled={!pay.email.trim()}
                >
                  Continue to Paystack <ArrowRight className="w-4 h-4 ml-1" />
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  🔒 Secured by Paystack · Card & M-Pesa accepted
                </p>
              </motion.div>
            )}

            {pay.step === "redirecting" && (
              <motion.div
                key="redirecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-8 flex flex-col items-center gap-4 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Redirecting to Paystack…</p>
                  <p className="text-sm text-muted-foreground mt-1">Please wait while we open secure checkout.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </section>
  );
}
