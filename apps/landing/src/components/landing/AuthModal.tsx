import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Calendar, ArrowRight } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "signin" | "signup";
}

export function AuthModal({ open, onClose, defaultTab = "signin" }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"signin" | "signup">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({ email: "", password: "", businessName: "" });

  function update(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (tab === "signin") {
        const { error: err } = await signIn(form.email, form.password);
        if (err) { setError(err); return; }
      } else {
        if (!form.businessName.trim()) { setError("Business name is required"); return; }
        const { error: err } = await signUp(form.email, form.password, form.businessName);
        if (err) { setError(err); return; }
      }
      onClose();
      navigate(tab === "signup" ? "/onboarding" : "/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-white">
          <div className="flex items-center mb-3">
            <img src="/nibook-icon.png" alt="Nibook" className="h-10 w-10 rounded-xl object-cover" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {tab === "signin" ? "Welcome back" : "Create your account"}
            </DialogTitle>
            <DialogDescription className="text-white/70 text-sm mt-1">
              {tab === "signin"
                ? "Sign in to manage your bookings and business"
                : "Start your 7-day free trial — no card needed"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          {/* Tab switcher */}
          <div className="flex bg-muted rounded-xl p-1">
            {(["signin", "signup"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  tab === t ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <AnimatePresence>
              {tab === "signup" && (
                <motion.div key="bizname" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <Input
                    placeholder="Business name (e.g. Amina's Beauty Studio)"
                    value={form.businessName}
                    onChange={e => update("businessName", e.target.value)}
                    required={tab === "signup"}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={e => update("email", e.target.value)}
              required
              autoComplete="email"
            />

            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={e => update("password", e.target.value)}
                required
                minLength={6}
                autoComplete={tab === "signin" ? "current-password" : "new-password"}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </motion.p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Please wait…</>
              ) : (
                <>{tab === "signin" ? "Sign In" : "Create Account"}<ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>

          {tab === "signup" && (
            <p className="text-xs text-center text-muted-foreground">
              By signing up you agree to our{" "}
              <a href="#" className="underline hover:text-primary">Terms of Service</a>{" "}
              and{" "}
              <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
