import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Send, CheckCircle2, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              n <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const ROLE_OPTIONS = [
  "Hair Stylist", "Salon Owner", "Barber", "Nail Technician",
  "Business Coach", "Fitness Trainer", "Spa & Wellness", "Clinic / Medical",
  "Photographer", "Consultant", "Other",
];

export default function ReviewsPage() {
  const [state, setState] = useState({
    name: "", role: "", rating: 0, body: "", submitted: false,
  });

  function submitReview(e: React.FormEvent) {
    e.preventDefault();
    const { name, role, rating, body } = state;
    const subject = encodeURIComponent(`Nibook Review — ${rating} stars`);
    const bodyText = encodeURIComponent(
      `Name: ${name}\nProfession: ${role}\nRating: ${rating}/5\n\nReview:\n${body}`
    );
    window.location.href = `mailto:hello@nibook.co?subject=${subject}&body=${bodyText}`;
    setState(s => ({ ...s, submitted: true }));
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar />

      <section className="pt-28 pb-20 bg-amber-500 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block text-xs font-semibold uppercase tracking-widest bg-white/15 px-4 py-1.5 rounded-full mb-6"
          >
            Early Access
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5"
          >
            Share your experience
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/80 max-w-xl mx-auto"
          >
            Nibook is brand new. Your honest feedback — what's great, what's broken — helps us improve faster than anything else.
          </motion.p>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {state.submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-green-100 bg-green-50 p-12 text-center"
            >
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Thank you for your review!</h3>
              <p className="text-muted-foreground">Your email client should have opened with your review pre-filled. Hit send and we'll read every word.</p>
              <button
                onClick={() => setState({ name: "", role: "", rating: 0, body: "", submitted: false })}
                className="mt-6 text-sm text-primary font-semibold hover:underline"
              >
                Leave another review
              </button>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onSubmit={submitReview}
              className="rounded-3xl border border-border bg-white shadow-sm p-8 space-y-6"
            >
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Your rating</label>
                <StarRating value={state.rating} onChange={(v) => setState(s => ({ ...s, rating: v }))} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Your name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amina K."
                    value={state.name}
                    onChange={e => setState(s => ({ ...s, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Your profession</label>
                  <div className="relative">
                    <select
                      required
                      value={state.role}
                      onChange={e => setState(s => ({ ...s, role: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none pr-8"
                    >
                      <option value="">Select...</option>
                      {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Your review</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Tell us what you love, what's frustrating, and anything you wish worked differently..."
                  value={state.body}
                  onChange={e => setState(s => ({ ...s, body: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!state.rating || !state.name || !state.body}
                className="w-full py-3.5 rounded-xl font-semibold bg-primary text-white text-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Review
              </button>
              <p className="text-xs text-muted-foreground text-center">
                This opens your email client with your review pre-filled. Just hit send.
              </p>
            </motion.form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
