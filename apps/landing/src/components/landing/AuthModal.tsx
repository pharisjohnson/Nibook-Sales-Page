import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, ArrowRight, Mail, RotateCcw } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { ROUTES } from "@/lib/routes";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "signin" | "signup";
}

type ModalStep = "form" | "verify" | "forgot" | "forgot-code" | "forgot-reset";

export function AuthModal({ open, onClose, defaultTab = "signin" }: AuthModalProps) {
  const { signIn, signUp, verifyEmail, resendVerification, sendResetPasswordEmail, verifyResetCode, resetPassword } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"signin" | "signup">(defaultTab);
  const [step, setStep] = useState<ModalStep>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [form, setForm] = useState({ email: "", password: "", businessName: "" });

  function update(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setError("");
  }

  function resetAuthState() {
    setStep("form");
    setOtp("");
    setError("");
    setResetToken("");
  }

  function handleClose() {
    resetAuthState();
    onClose();
  }

  function handleBack() {
    setStep("form");
    setError("");
    setOtp("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (tab === "signin") {
        const { error: err } = await signIn(form.email, form.password);
        if (err) { setError(err); return; }
        resetAuthState();
        navigate(ROUTES.dashboard.home);
      } else {
        const { error: err, requiresVerification } = await signUp(form.email, form.password, form.businessName);
        if (err) { setError(err); return; }
        if (requiresVerification) {
          setPendingEmail(form.email);
          setStep("verify");
        } else {
          resetAuthState();
          navigate(ROUTES.onboarding);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.trim().length < 6) { setError("Please enter the full 6-digit code"); return; }
    setLoading(true);
    setError("");
    try {
      const { error: err } = await verifyEmail(pendingEmail, otp.trim(), form.businessName);
      if (err) { setError(err); return; }
      resetAuthState();
      navigate(ROUTES.onboarding);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    const { error: err } = await resendVerification(pendingEmail);
    if (err) setError(err);
    setOtp("");
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: err } = await sendResetPasswordEmail(form.email);
      if (err) { setError(err); return; }
      setPendingEmail(form.email);
      setStep("forgot-code");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.trim().length < 6) { setError("Please enter the full 6-digit code"); return; }
    setLoading(true);
    setError("");
    try {
      const { error: err, resetToken: token } = await verifyResetCode(pendingEmail, otp.trim());
      if (err) { setError(err); return; }
      if (token) setResetToken(token);
      setStep("forgot-reset");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");
    try {
      const { error: err } = await resetPassword(form.password, resetToken);
      if (err) { setError(err); return; }
      resetAuthState();
      navigate(ROUTES.dashboard.home);
    } finally {
      setLoading(false);
    }
  }

  const headerCopy = {
    form: {
      signin: { title: "Welcome back", desc: "Sign in to manage your bookings and business" },
      signup: { title: "Create your account", desc: "Start your 7-day free trial — no card needed" },
    },
    verify: { title: "Check your email", desc: `We sent a 6-digit code to ${pendingEmail}` },
    forgot: { title: "Reset password", desc: "Enter your email and we'll send you a reset code" },
    "forgot-code": { title: "Check your email", desc: `We sent a 6-digit code to ${pendingEmail}` },
    "forgot-reset": { title: "Set new password", desc: "Choose a new password for your account" },
  };

  const header = step in headerCopy
    ? headerCopy[step as keyof typeof headerCopy]
    : headerCopy.form[tab];

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-white">
          <div className="flex items-center mb-3">
            <img src="/nibook-icon.png" alt="Nibook" className="h-[72px] w-[72px] rounded-xl object-cover" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-white text-xl">{header.title}</DialogTitle>
            <DialogDescription className="text-white/70 text-sm mt-1">{header.desc}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          <AnimatePresence mode="wait">

            {/* ── Verify step ── */}
            {step === "verify" && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="flex justify-center py-2">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Mail className="w-8 h-8 text-primary" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">
                      Verification code
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={e => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                      autoFocus
                      className="text-center text-2xl tracking-[0.5em] font-mono"
                      maxLength={6}
                    />
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      {error}
                    </motion.p>
                  )}

                  <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
                    {loading
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying…</>
                      : <>Verify & Continue <ArrowRight className="w-4 h-4 ml-2" /></>
                    }
                  </Button>

                  <button
                    type="button"
                    onClick={handleResend}
                    className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Resend code
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── Forgot password: email step ── */}
            {step === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="flex justify-center py-2">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <KeyRound className="w-8 h-8 text-primary" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">
                      Email address
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={e => update("email", e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      {error}
                    </motion.p>
                  )}

                  <Button type="submit" className="w-full" disabled={loading || !form.email}>
                    {loading
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</>
                      : <>Send Reset Code <ArrowRight className="w-4 h-4 ml-2" /></>
                    }
                  </Button>

                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to sign in
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── Forgot password: code step ── */}
            {step === "forgot-code" && (
              <motion.div
                key="forgot-code"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleForgotCodeSubmit} className="space-y-4">
                  <div className="flex justify-center py-2">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Mail className="w-8 h-8 text-primary" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">
                      Reset code
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={e => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                      autoFocus
                      className="text-center text-2xl tracking-[0.5em] font-mono"
                      maxLength={6}
                    />
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      {error}
                    </motion.p>
                  )}

                  <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
                    {loading
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying…</>
                      : <>Verify Code <ArrowRight className="w-4 h-4 ml-2" /></>
                    }
                  </Button>

                  <button
                    type="button"
                    onClick={handleResend}
                    className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Resend code
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── Forgot password: new password step ── */}
            {step === "forgot-reset" && (
              <motion.div
                key="forgot-reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="flex justify-center py-2">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <KeyRound className="w-8 h-8 text-primary" />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-semibold text-foreground mb-1.5">
                      New password
                    </label>
                    <Input
                      type={showPass ? "text" : "password"}
                      placeholder="Enter new password"
                      value={form.password}
                      onChange={e => update("password", e.target.value)}
                      required
                      minLength={6}
                      autoFocus
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-[calc(50%+10px)] -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

                  <Button type="submit" className="w-full" disabled={loading || form.password.length < 6}>
                    {loading
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting…</>
                      : <>Reset Password <ArrowRight className="w-4 h-4 ml-2" /></>
                    }
                  </Button>
                </form>
              </motion.div>
            )}

            {/* ── Auth form step ── */}
            {step === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
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

                {tab === "signin" && (
                  <button
                    type="button"
                    onClick={() => { setStep("forgot"); setError(""); }}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                )}

                {tab === "signup" && (
                  <p className="text-xs text-center text-muted-foreground">
                    By signing up you agree to our{" "}
                    <a href="/terms" className="underline hover:text-primary">Terms of Service</a>{" "}
                    and{" "}
                    <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>.
                  </p>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
