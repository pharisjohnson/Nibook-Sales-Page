import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Lightbulb, Send, CheckCircle2, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

const CATEGORIES = ["Bookings", "Payments", "Dashboard", "Notifications", "Integrations", "Mobile App", "Reporting", "Other"];

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

export default function FeedbackPage() {
  const [reviewState, setReviewState] = useState({
    name: "", role: "", rating: 0, body: "", submitted: false,
  });
  const [featureState, setFeatureState] = useState({
    title: "", category: "", description: "", submitted: false,
  });

  function submitReview(e: React.FormEvent) {
    e.preventDefault();
    const { name, role, rating, body } = reviewState;
    const subject = encodeURIComponent(`Nibook Review — ${rating} stars`);
    const bodyText = encodeURIComponent(
      `Name: ${name}\nProfession: ${role}\nRating: ${rating}/5\n\nReview:\n${body}`
    );
    window.location.href = `mailto:nibook@noonstudio.africa?subject=${subject}&body=${bodyText}`;
    setReviewState(s => ({ ...s, submitted: true }));
  }

  function submitFeature(e: React.FormEvent) {
    e.preventDefault();
    const { title, category, description } = featureState;
    const subject = encodeURIComponent(`Feature Request: ${title}`);
    const bodyText = encodeURIComponent(
      `Feature: ${title}\nCategory: ${category}\n\nDescription:\n${description}`
    );
    window.location.href = `mailto:nibook@noonstudio.africa?subject=${subject}&body=${bodyText}`;
    setFeatureState(s => ({ ...s, submitted: true }));
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-20 bg-primary text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block text-xs font-semibold uppercase tracking-widest bg-white/10 px-4 py-1.5 rounded-full mb-6"
          >
            Early Access
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5"
          >
            Your voice shapes Nibook
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-primary-foreground/80 max-w-xl mx-auto"
          >
            We're in early access and every piece of feedback directly influences what we build next. Share your experience or tell us what's missing.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-8 flex justify-center gap-4"
          >
            <a href="#reviews" className="px-6 py-3 bg-white text-primary font-semibold rounded-full hover:bg-white/90 transition-colors text-sm">
              Leave a Review
            </a>
            <a href="#feature-requests" className="px-6 py-3 bg-white/10 border border-white/20 font-semibold rounded-full hover:bg-white/20 transition-colors text-sm">
              Request a Feature
            </a>
          </motion.div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="py-24 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-5">
              <Star className="w-7 h-7 text-amber-500" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Share your experience</h2>
            <p className="mt-3 text-muted-foreground">
              What's working well? What could be better? Honest feedback only — we can handle it.
            </p>
          </motion.div>

          {reviewState.submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-green-100 bg-green-50 p-12 text-center"
            >
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Thank you for your review!</h3>
              <p className="text-muted-foreground">Your email client should have opened with your review. Hit send and we'll read every word.</p>
              <button
                onClick={() => setReviewState({ name: "", role: "", rating: 0, body: "", submitted: false })}
                className="mt-6 text-sm text-primary font-semibold hover:underline"
              >
                Leave another review
              </button>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onSubmit={submitReview}
              className="rounded-3xl border border-border bg-white shadow-sm p-8 space-y-6"
            >
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Your rating</label>
                <StarRating value={reviewState.rating} onChange={(v) => setReviewState(s => ({ ...s, rating: v }))} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Your name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amina K."
                    value={reviewState.name}
                    onChange={e => setReviewState(s => ({ ...s, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Your profession</label>
                  <div className="relative">
                    <select
                      required
                      value={reviewState.role}
                      onChange={e => setReviewState(s => ({ ...s, role: e.target.value }))}
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
                  value={reviewState.body}
                  onChange={e => setReviewState(s => ({ ...s, body: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!reviewState.rating || !reviewState.name || !reviewState.body}
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

      {/* Feature Requests */}
      <section id="feature-requests" className="py-24 bg-muted/30">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-5">
              <Lightbulb className="w-7 h-7 text-sky-500" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Request a feature</h2>
            <p className="mt-3 text-muted-foreground">
              Something missing from your workflow? We build what our users actually ask for. No idea is too small.
            </p>
          </motion.div>

          {featureState.submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl border border-sky-100 bg-sky-50 p-12 text-center"
            >
              <CheckCircle2 className="w-12 h-12 text-sky-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Request received!</h3>
              <p className="text-muted-foreground">Your email client should be open. Send the email and we'll add it to our roadmap review.</p>
              <button
                onClick={() => setFeatureState({ title: "", category: "", description: "", submitted: false })}
                className="mt-6 text-sm text-primary font-semibold hover:underline"
              >
                Submit another request
              </button>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onSubmit={submitFeature}
              className="rounded-3xl border border-border bg-white shadow-sm p-8 space-y-6"
            >
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Feature title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Recurring appointments"
                  value={featureState.title}
                  onChange={e => setFeatureState(s => ({ ...s, title: e.target.value }))}
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
                      onClick={() => setFeatureState(s => ({ ...s, category: cat }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        featureState.category === cat
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
                  value={featureState.description}
                  onChange={e => setFeatureState(s => ({ ...s, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!featureState.title || !featureState.description}
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

      <Footer />
    </div>
  );
}
