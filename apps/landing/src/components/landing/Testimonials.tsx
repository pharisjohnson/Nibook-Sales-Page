import { motion } from "framer-motion";
import { Star, Lightbulb, Share2, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

const cards = [
  {
    icon: Star,
    title: "Share your experience",
    body: "Tried Nibook? A 2-minute honest review — what's great, what's not — helps us improve faster than anything else.",
    cta: "Write a review",
    href: "/reviews",
    color: "bg-amber-400/20 text-amber-300",
  },
  {
    icon: Lightbulb,
    title: "Request a feature",
    body: "Something missing from your workflow? Tell us exactly what you need. We build what our users actually ask for.",
    cta: "Submit a request",
    href: "/feature-requests",
    color: "bg-sky-400/20 text-sky-300",
  },
  {
    icon: Share2,
    title: "Refer a professional",
    body: "Know a salon owner, coach, or clinic that still runs on WhatsApp? Invite them — and earn 10% off your first month.",
    cta: "See the offer",
    href: "/referral",
    color: "bg-emerald-400/20 text-emerald-300",
  },
];

export function Testimonials() {
  const [, navigate] = useLocation();

  return (
    <section id="feedback" className="py-24 bg-primary text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-widest bg-white/10 px-4 py-1.5 rounded-full mb-4">
            Early Access
          </span>
          <h2 className="text-3xl md:text-4xl font-bold">
            Help shape Nibook from the ground up
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/75">
            Nibook is brand new and we're looking for service professionals to try it, share honest feedback, and tell us what features would transform their business.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 flex flex-col justify-between gap-6"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${card.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                  <p className="text-primary-foreground/75 leading-relaxed">{card.body}</p>
                </div>
                <button
                  onClick={() => navigate(card.href)}
                  className="inline-flex items-center gap-2 font-semibold text-sm text-white hover:text-accent transition-colors group"
                >
                  {card.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
