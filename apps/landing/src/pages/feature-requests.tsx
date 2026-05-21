import { useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Send, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

const CATEGORIES = ["Bookings", "Payments", "Dashboard", "Notifications", "Integrations", "Mobile App", "Reporting", "Other"];

export default function FeatureRequestsPage() {
  const [state, setState] = useState({
    title: "", category: "", description: "", submitted: false,
  });

  function submitFeature(e: React.FormEvent) {
    e.preventDefault();
    const { title, category, description } = state;
    const subject = encodeURIComponent(`Feature Request: ${title}`);
    const bodyText = encodeURIComponent(
      `Feature: ${title}\nCategory: ${category}\n\nDescription:\n${description}`
    );
    window.location.href = `mailto:nibook@noonstudio.africa?subject=${subject}&body=${bodyText}`;
    setState(s => ({ ...s, submitted: true }));
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar />

      <section className="pt-36 pb-28 bg-sky-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block text-xs font-semibold uppercase tracking-widest bg-white/15 px-4 py-1.5 rounded-full mb-6"
          >
            Roadmap
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5"
          >
            Request a feature
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/80 max-w-xl mx-auto"
          >
            Something missing from your workflow? We build what our users actually ask for. No idea is too small.
          </motion.p>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {state.submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-sky-100 bg-sky-50 p-12 text-center"
            >
              <CheckCircle2 className="w-12 h-12 text-sky-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Request received!</h3>
              <p className="text-muted-foreground">Your email client should be open. Send the email and we'll add it to our roadmap review.</p>
              <button
                onClick={() => setState({ title: "", category: "", description: "", submitted: false })}
                className="mt-6 text-sm text-primary font-semibold hover:underline"
              >
                Submit another request
              </button>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onSubmit={submitFeature}
              className="rounded-3xl border border-border bg-white shadow-sm p-8 space-y-6"
            >
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Feature title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Recurring appointments"
                  value={state.title}
                  onChange={e => setState(s => ({ ...s, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setState(s => ({ ...s, category: cat }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        state.category === cat
                          ? "bg-primary text-white border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Describe the feature</label>
                <textarea
                  required
                  rows={5}
                  placeholder="What problem would this solve? How would you use it in your business?"
                  value={state.description}
                  onChange={e => setState(s => ({ ...s, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!state.title || !state.description}
                className="w-full py-3.5 rounded-xl font-semibold bg-primary text-white text-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Request
              </button>
              <p className="text-xs text-muted-foreground text-center">
                This opens your email client with your request pre-filled. Just hit send.
              </p>
            </motion.form>
          )}
        </div>
      </section>

      <section className="py-16 bg-muted/30 border-t border-border">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Lightbulb className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Got a different kind of feedback?</h2>
            <p className="text-muted-foreground mb-6">We also want to hear how the overall experience feels — not just features.</p>
            <a
              href="/reviews"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Leave a review instead
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
