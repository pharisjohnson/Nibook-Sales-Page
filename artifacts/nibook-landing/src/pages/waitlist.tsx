import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Calendar, ArrowLeft, Mail, CheckCircle2, Loader2, Users, Zap, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true);
    setError("");
    try {
      const { data: res, error: err } = await apiFetch("/waitlist", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim() || undefined }),
      });
      if (err) {
        setError("Something went wrong. Please try again.");
        return;
      }
      if ((res as any)?.duplicate) {
        setSubmitted(true);
        return;
      }
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex flex-col">
      {/* Nav */}
      <nav className="p-6 flex items-center gap-3">
        <Link href="/">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <div className="flex items-center gap-1.5">
              <div className="bg-primary text-white p-1 rounded-md">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="font-bold text-foreground">Nibook</span>
            </div>
          </button>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {!submitted ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {/* Header */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full">
                  <Zap className="w-4 h-4" />
                  Pro Plan — Coming Soon
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                  Be first in line for Pro
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Nibook Pro will unlock advanced analytics, team management, WhatsApp automation, and custom booking pages. Join the waitlist to get early access and special pricing.
                </p>
              </div>

              {/* Perks */}
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: Zap, text: "Early access before public launch" },
                  { icon: Bell, text: "Special launch pricing — locked in for life" },
                  { icon: Users, text: "Priority onboarding support from our team" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 bg-white border border-border rounded-xl p-4 shadow-sm">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{text}</span>
                  </div>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="font-semibold text-foreground">Join the waitlist</h2>
                <Input
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(""); }}
                />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  required
                />
                {error && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                )}
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {loading ? "Joining…" : "Join Waitlist"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  No spam, ever. We'll only email you when Pro launches.
                </p>
              </form>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 bg-white border border-border rounded-2xl p-10 shadow-sm"
            >
              <div className="flex justify-center">
                <div className="p-4 bg-green-100 rounded-full">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">You're on the list!</h2>
                <p className="text-muted-foreground">
                  We'll email <span className="font-medium text-foreground">{email}</span> as soon as Pro is ready for early access.
                </p>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
