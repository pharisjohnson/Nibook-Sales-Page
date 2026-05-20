import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Clock, MapPin, Send, CheckCircle2, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

const TOPICS = ["General enquiry", "Billing & payments", "Technical issue", "Feature request", "Partnership", "Other"];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "", submitted: false });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`[${form.topic}] ${form.name}`);
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\nTopic: ${form.topic}\n\nMessage:\n${form.message}`);
    window.location.href = `mailto:hello@nibook.co?subject=${subject}&body=${body}`;
    setForm(s => ({ ...s, submitted: true }));
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar />

      <section className="pt-28 pb-14 bg-muted/30 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-5">Contact</span>
            <h1 className="text-4xl font-extrabold text-foreground mb-3">Get in touch</h1>
            <p className="text-muted-foreground">We'd love to hear from you. We read and respond to every message.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-10">

            {/* Info column */}
            <div className="md:col-span-2 space-y-8">
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email us</h3>
                      <a href="mailto:hello@nibook.co" className="text-sm text-primary hover:underline">hello@nibook.co</a>
                      <p className="text-xs text-muted-foreground mt-1">For all general enquiries</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">WhatsApp</h3>
                      <a href="https://wa.me/254700000000" className="text-sm text-primary hover:underline" target="_blank" rel="noopener noreferrer">+254 700 000 000</a>
                      <p className="text-xs text-muted-foreground mt-1">Quickest response for urgent issues</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Response time</h3>
                      <p className="text-sm text-muted-foreground">Within 24 hours, Monday – Friday</p>
                      <p className="text-xs text-muted-foreground mt-1">East Africa Time (EAT, UTC+3)</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Based in</h3>
                      <p className="text-sm text-muted-foreground">Nairobi, Kenya</p>
                      <p className="text-xs text-muted-foreground mt-1">Serving all of East Africa</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 p-5 rounded-2xl bg-primary text-white">
                  <h4 className="font-semibold mb-2">Need help right now?</h4>
                  <p className="text-sm text-primary-foreground/80 mb-4">Check our Help Center for instant answers to common questions about bookings, payments, and account settings.</p>
                  <a href="/help" className="inline-block text-sm font-semibold bg-white text-primary px-4 py-2 rounded-xl hover:bg-white/90 transition-colors">
                    Visit Help Center
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Form column */}
            <div className="md:col-span-3">
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                {form.submitted ? (
                  <div className="rounded-3xl border border-green-100 bg-green-50 p-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Message ready to send!</h3>
                    <p className="text-muted-foreground">Your email client opened with your message pre-filled. Hit send and we'll get back to you within 24 hours.</p>
                    <button
                      onClick={() => setForm({ name: "", email: "", topic: "", message: "", submitted: false })}
                      className="mt-6 text-sm text-primary font-semibold hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="rounded-3xl border border-border bg-white shadow-sm p-8 space-y-5"
                  >
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Your name</label>
                        <input
                          type="text"
                          required
                          placeholder="Amina Kamau"
                          value={form.name}
                          onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Email address</label>
                        <input
                          type="email"
                          required
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={e => setForm(s => ({ ...s, email: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Topic</label>
                      <div className="flex flex-wrap gap-2">
                        {TOPICS.map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setForm(s => ({ ...s, topic: t }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                              form.topic === t
                                ? "bg-primary text-white border-primary"
                                : "border-border text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">Message</label>
                      <textarea
                        required
                        rows={6}
                        placeholder="Tell us what's on your mind..."
                        value={form.message}
                        onChange={e => setForm(s => ({ ...s, message: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!form.name || !form.email || !form.message}
                      className="w-full py-3.5 rounded-xl font-semibold bg-primary text-white text-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send Message
                    </button>
                    <p className="text-xs text-muted-foreground text-center">
                      This opens your email client with your message pre-filled. Just hit send.
                    </p>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
