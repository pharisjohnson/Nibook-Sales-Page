import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Link2, Share2, CheckCircle2, Users, CreditCard, ArrowRight, Copy, Check } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/lib/auth";

const BASE_URL = "https://nibook.noonstudio.africa";

function generateReferralCode(userId: string) {
  return `REF-${userId.slice(0, 8).toUpperCase()}`;
}

const STEPS = [
  {
    icon: Link2,
    title: "Copy your referral link",
    body: "Get your unique link below. Every signup through your link is tracked to you automatically.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Share2,
    title: "Share it with a professional",
    body: "Send it to a salon owner, coach, barber, or anyone running appointments on WhatsApp.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: Gift,
    title: "Both of you win",
    body: "When your friend subscribes to any paid plan, you get 10% off your first month of Starter. They get a 7-day free trial.",
    color: "bg-emerald-100 text-emerald-600",
  },
];

export default function ReferralPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = user ? generateReferralCode(user.id) : null;
  const referralUrl = referralCode ? `${BASE_URL}/?ref=${referralCode}` : BASE_URL;

  function copyLink() {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `Hey! I've been using Nibook to manage my bookings — no more chasing clients on WhatsApp. Try it free: ${referralUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function shareTwitter() {
    const text = encodeURIComponent(
      `Just started using @NibookApp to manage my bookings and it's been a game changer. Try it free 👇 ${referralUrl}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar variant="light" />

      {/* Hero */}
      <section className="pt-36 pb-28 bg-primary text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <Gift className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5"
          >
            Invite a Pro,{" "}
            <span className="text-accent">Earn 10% Off</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-primary-foreground/80 max-w-xl mx-auto"
          >
            Know someone still managing bookings on WhatsApp? Refer them to Nibook. When they subscribe, you get 10% off your first month of Starter — on us.
          </motion.p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">How it works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Simple as 1 – 2 – 3</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-7 left-[calc(50%+2rem)] w-full h-px border-t-2 border-dashed border-border" />
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${step.color}`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="w-7 h-7 rounded-full bg-foreground text-white text-xs font-bold flex items-center justify-center mb-4">{i + 1}</div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Referral Link */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-border bg-white shadow-sm p-8 text-center"
          >
            {user ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Link2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Your referral link</h3>
                <p className="text-muted-foreground text-sm mb-6">Share this link. When someone signs up and subscribes through it, you earn your discount automatically.</p>

                <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-4 py-3 mb-4">
                  <span className="flex-1 text-sm text-foreground font-mono truncate text-left">{referralUrl}</span>
                  <button
                    onClick={copyLink}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      copied ? "bg-green-100 text-green-700" : "bg-primary text-white hover:bg-primary/90"
                    }`}
                  >
                    {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={shareWhatsApp}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebd5a] transition-colors"
                  >
                    <Share2 className="w-4 h-4" /> WhatsApp
                  </button>
                  <button
                    onClick={shareTwitter}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1DA1F2] text-white text-sm font-semibold hover:bg-[#0d8dd4] transition-colors"
                  >
                    <Share2 className="w-4 h-4" /> Twitter / X
                  </button>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  Your code: <span className="font-mono font-bold text-foreground">{referralCode}</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Get your personal referral link</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Create a free Nibook account to get your unique referral link. It only takes 2 minutes.
                </p>
                <a
                  href="/?signup=true"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
                >
                  Create a free account <ArrowRight className="w-4 h-4" />
                </a>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Reward Summary */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6"
          >
            <div className="rounded-3xl bg-primary text-white p-8">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">You get</h3>
              <p className="text-4xl font-extrabold text-accent mb-3">10% off</p>
              <p className="text-primary-foreground/80 text-sm">
                Your first month of Starter (KES 1,080 instead of KES 1,200) when your referred friend subscribes to any paid plan. Must not already be a paying subscriber.
              </p>
            </div>
            <div className="rounded-3xl bg-foreground text-white p-8">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Your friend gets</h3>
              <p className="text-4xl font-extrabold text-accent mb-3">7 days free</p>
              <p className="text-white/70 text-sm">
                A full 7-day free trial on the Starter plan with no credit card required. They experience the full product before paying anything.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Fine print */}
      <section className="pb-20 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-muted/40 border border-border p-6">
            <h4 className="text-sm font-semibold text-foreground mb-3">Referral programme terms</h4>
            <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside">
              <li>10% discount applies to your first paid month of the Starter plan only.</li>
              <li>Discount is only available if you are not already a paying Nibook subscriber at the time of claim.</li>
              <li>Your referred friend must sign up using your unique referral link and activate a paid subscription.</li>
              <li>Referral rewards cannot be combined with other promotions or applied to the Premium plan.</li>
              <li>Nibook reserves the right to cancel referral rewards in cases of suspected fraud or abuse.</li>
              <li>Contact <a href="mailto:nibook@noonstudio.africa" className="text-primary hover:underline">nibook@noonstudio.africa</a> to claim your discount once your referral has subscribed.</li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
