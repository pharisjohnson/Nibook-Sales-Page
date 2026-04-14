import { motion, AnimatePresence } from "framer-motion";
import { Check, Zap, Users, Building2, Gift, Phone, Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    amount: 0,
    priceSuffix: "",
    subtext: "Tailored pricing for your scale",
    seats: "Unlimited users",
    cta: "Contact Sales",
    isTrial: false,
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

type PayStep = "idle" | "form" | "pending" | "success" | "failed";

interface PayState {
  plan: typeof plans[0] | null;
  phone: string;
  reference: string;
  step: PayStep;
  message: string;
}

export function Pricing() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [pay, setPay] = useState<PayState>({
    plan: null, phone: "", reference: "", step: "idle", message: "",
  });

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
    setPay({ plan, phone: "", reference: "", step: "form", message: "" });
  }

  function closePay() {
    if (pollTimer.current) clearInterval(pollTimer.current);
    setPay(s => ({ ...s, step: "idle", plan: null }));
  }

  async function initiatePayment() {
    if (!pay.plan) return;
    const rawPhone = pay.phone.trim();
    if (!rawPhone || rawPhone.length < 9) {
      toast({ title: "Invalid phone", description: "Enter a valid Safaricom number.", variant: "destructive" });
      return;
    }

    setPay(s => ({ ...s, step: "pending", message: "Sending STK Push to your phone…" }));

    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: rawPhone,
          amount: pay.plan.amount,
          plan: pay.plan.name,
        }),
      });
      const data = await res.json() as { success: boolean; reference?: string; message?: string };

      if (!res.ok || !data.success) {
        setPay(s => ({ ...s, step: "failed", message: data.message ?? "Payment initiation failed." }));
        return;
      }

      const ref = data.reference ?? "";
      setPay(s => ({ ...s, reference: ref, message: "STK Push sent — enter your M-Pesa PIN on your phone." }));
      pollStatus(ref);
    } catch {
      setPay(s => ({ ...s, step: "failed", message: "Could not reach the payment server. Try again." }));
    }
  }

  function pollStatus(reference: string) {
    let attempts = 0;
    pollTimer.current = setInterval(async () => {
      attempts++;
      if (attempts > 20) {
        clearInterval(pollTimer.current!);
        setPay(s => ({ ...s, step: "failed", message: "Payment timed out. Please try again." }));
        return;
      }
      try {
        const res = await fetch(`/api/payments/status/${encodeURIComponent(reference)}`);
        const data = await res.json() as { success: boolean; status?: string };
        const status = (data.status ?? "").toUpperCase();
        if (status === "SUCCESS" || status === "COMPLETE" || status === "COMPLETED") {
          clearInterval(pollTimer.current!);
          setPay(s => ({ ...s, step: "success", message: "Payment confirmed! Welcome to Nibook." }));
        } else if (status === "FAILED" || status === "CANCELLED" || status === "CANCELED") {
          clearInterval(pollTimer.current!);
          setPay(s => ({ ...s, step: "failed", message: "Payment was cancelled or failed. Try again." }));
        }
      } catch { /* ignore, keep polling */ }
    }, 4000);
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
          All plans include M-Pesa support · Cancel anytime · Prices in KES
        </motion.p>
      </div>

      {/* ── Payment Dialog ── */}
      <Dialog open={pay.step !== "idle"} onOpenChange={open => { if (!open) closePay(); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              Pay with M-Pesa
            </DialogTitle>
            <DialogDescription>
              {pay.plan && (
                <span>
                  <strong>{pay.plan.name}</strong> — KES {pay.plan.price}/month
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {pay.step === "form" && (
              <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                  Enter your Safaricom number. You'll receive an STK Push to enter your M-Pesa PIN.
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">🇰🇪 +254</span>
                    <Input
                      className="pl-[72px]"
                      placeholder="7XX XXX XXX"
                      value={pay.phone}
                      onChange={e => setPay(s => ({ ...s, phone: e.target.value.replace(/\D/g, "") }))}
                      maxLength={10}
                      inputMode="numeric"
                      onKeyDown={e => { if (e.key === "Enter") initiatePayment(); }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-foreground">KES {pay.plan?.price}/month</span>
                </div>
                <Button className="w-full" onClick={initiatePayment}>
                  Send STK Push <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {pay.step === "pending" && (
              <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Awaiting payment…</p>
                  <p className="text-sm text-muted-foreground mt-1">{pay.message}</p>
                </div>
                <div className="w-full p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 text-left">
                  📱 Check your phone and enter your M-Pesa PIN to complete the payment.
                </div>
              </motion.div>
            )}

            {pay.step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="py-6 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-lg text-foreground">Payment Confirmed!</p>
                  <p className="text-sm text-muted-foreground mt-1">{pay.message}</p>
                </div>
                <Button className="w-full" onClick={() => { closePay(); setLocation("/dashboard"); }}>
                  Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {pay.step === "failed" && (
              <motion.div key="failed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="py-6 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-9 h-9 text-red-500" />
                </div>
                <div>
                  <p className="font-bold text-lg text-foreground">Payment Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{pay.message}</p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1" onClick={closePay}>Cancel</Button>
                  <Button className="flex-1" onClick={() => setPay(s => ({ ...s, step: "form", message: "" }))}>Try Again</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </section>
  );
}
