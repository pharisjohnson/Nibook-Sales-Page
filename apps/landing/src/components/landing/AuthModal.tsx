import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowRight, Mail, CheckCircle2 } from "lucide-react";
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

type View = "signin" | "signup" | "forgot" | "forgot-code" | "forgot-success";

export function AuthModal({ open, onClose, defaultTab = "signin" }: AuthModalProps) {
  const { signIn, signUp, sendResetCode, resetPassword, emailVerificationSuccess, pendingEmail, clearVerificationFlag } = useAuth();
  const [, navigate] = useLocation();
  const [view, setView] = useState<View>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", businessName: "" });
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      setShowPass(false);
      setView(defaultTab);

      if (emailVerificationSuccess) {
        setView("signin");
        setForm(f => ({ ...f, email: pendingEmail || f.email }));
      }
    }
  }, [open, emailVerificationSuccess, pendingEmail, defaultTab]);

  function update(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (view === "signin") {
        const { error: err } = await signIn(form.email, form.password);
        if (err) { setError(err); return; }
        onClose();
        navigate("/dashboard");
      } else if (view === "signup") {
        if (!form.businessName.trim()) { setError("Business name is required"); return; }
        const { error: err, needsEmailVerification } = await signUp(form.email, form.password, form.businessName);
        if (err) { setError(err); return; }
        if (needsEmailVerification) {
          onClose();
          navigate(`/auth/verify?email=${encodeURIComponent(form.email)}`);
          return;
        }
        onClose();
        navigate("/onboarding");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSendResetCode() {
    if (!resetEmail.trim()) { setError("Enter your email"); return; }
    setLoading(true);
    setError("");
    const { error: err } = await sendResetCode(resetEmail);
    setLoading(false);
    if (err) { setError(err); return; }
    setView("forgot-code");
  }

  async function handleResetPassword() {
    if (resetCode.length < 4) { setError("Enter the reset code from your email"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");
    const { error: err } = await resetPassword(resetCode, newPassword);
    setLoading(false);
    if (err) { setError(err); return; }
    setView("forgot-success");
  }

  function handleClose() {
    onClose();
    clearVerificationFlag();
  }

  function renderForgotPassword() {
    return (
      <div className="p-6 space-y-5">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-primary/10 text-primary p-3 rounded-2xl">
              <Mail className="w-6 h-6" />
            </div>
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl">Reset your password</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              We'll send a reset code to your email
            </DialogDescription>
          </DialogHeader>
        </div>

        <input
          type="email"
          placeholder="Email address"
          value={resetEmail}
          onChange={e => { setResetEmail(e.target.value); setError(""); }}
          className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          autoComplete="email"
        />

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <Button className="w-full" disabled={loading || !resetEmail.trim()} onClick={handleSendResetCode}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</> : "Send Reset Code"}
        </Button>

        <div className="text-center">
          <button type="button" onClick={() => { setView("signin"); setError(""); }} className="text-sm text-primary hover:underline">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  function renderForgotCode() {
    return (
      <div className="p-6 space-y-5">
        <div className="text-center">
          <DialogHeader>
            <DialogTitle className="text-xl">Enter reset code</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Check <span className="font-semibold text-foreground">{resetEmail}</span> for the code
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-3">
          <input
            type="text"
              inputMode="numeric"
            placeholder="Reset code"
            value={resetCode}
            onChange={e => { setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              placeholder="New password"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setError(""); }}
              minLength={6}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
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
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <Button className="w-full" disabled={loading || resetCode.length < 4 || newPassword.length < 6} onClick={handleResetPassword}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting…</> : "Reset Password"}
        </Button>

        <div className="text-center">
          <button type="button" onClick={handleSendResetCode} disabled={loading} className="text-sm text-primary hover:underline disabled:text-muted-foreground">
            Resend code
          </button>
        </div>
      </div>
    );
  }

  function renderForgotSuccess() {
    return (
      <div className="p-6 space-y-5 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <DialogHeader>
          <DialogTitle className="text-xl">Password reset!</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Sign in with your new password
          </DialogDescription>
        </DialogHeader>
        <Button className="w-full" onClick={() => { setView("signin"); setForm(f => ({ ...f, email: resetEmail })); setError(""); }}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        {view === "forgot" ? renderForgotPassword() :
         view === "forgot-code" ? renderForgotCode() :
         view === "forgot-success" ? renderForgotSuccess() : (
        <>
          <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-white">
            <div className="flex items-center mb-3">
              <img src="/nibook-icon.png" alt="Nibook" className="h-[72px] w-[72px] rounded-xl object-cover" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-white text-xl">
                {view === "signin" ? "Welcome back" : "Create your account"}
              </DialogTitle>
              <DialogDescription className="text-white/70 text-sm mt-1">
                {view === "signin"
                  ? "Sign in to manage your bookings and business"
                  : "Start your 7-day free trial — no card needed"}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex bg-muted rounded-xl p-1">
              {(["signin", "signup"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setView(t); setError(""); }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    view === t ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {emailVerificationSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3"
              >
                Email verified! Sign in to continue.
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <AnimatePresence>
                {view === "signup" && (
                  <motion.div key="bizname" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <Input
                      placeholder="Business name (e.g. Amina's Beauty Studio)"
                      value={form.businessName}
                      onChange={e => update("businessName", e.target.value)}
                      required={view === "signup"}
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
                  autoComplete={view === "signin" ? "current-password" : "new-password"}
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

              {view === "signin" && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setView("forgot"); setResetEmail(form.email); setError(""); }}
                    className="text-xs text-muted-foreground hover:text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </motion.p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Please wait…</>
                ) : (
                  <>{view === "signin" ? "Sign In" : "Create Account"}<ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </form>

            {view === "signup" && (
              <p className="text-xs text-center text-muted-foreground">
                By signing up you agree to our{" "}
                <a href="#" className="underline hover:text-primary">Terms of Service</a>{" "}
                and{" "}
                <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
              </p>
            )}
          </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
