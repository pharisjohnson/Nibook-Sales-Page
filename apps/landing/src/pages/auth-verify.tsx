import { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle2, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, PENDING_SIGNUP_KEY } from "@/lib/auth";
import { useLocation } from "wouter";

export default function AuthVerifyPage() {
  const { verifyEmail, resendVerificationCode } = useAuth();
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
    } else {
      const stored = sessionStorage.getItem(PENDING_SIGNUP_KEY);
      if (stored) {
        try {
          const { email: storedEmail } = JSON.parse(stored);
          setEmail(storedEmail);
        } catch {}
      }
    }
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const id = setTimeout(() => setResendTimer(t => t - 1), 1000);
      return () => clearTimeout(id);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (verified) {
      const timer = setTimeout(() => navigate("/onboarding"), 1500);
      return () => clearTimeout(timer);
    }
  }, [verified, navigate]);

  function handleOtpChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setOtp(digits);
    setError("");
  }

  async function handleVerify() {
    if (otp.length !== 6) { setError("Enter the full 6-digit code"); return; }
    setLoading(true);
    setError("");

    const { error: err } = await verifyEmail(email, otp);
    if (err) { setError(err); setLoading(false); return; }

    setVerified(true);
    setLoading(false);
  }

  async function handleResend() {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    const { error: err } = await resendVerificationCode(email);
    setResending(false);
    if (err) { setError(err); return; }
    setResendTimer(60);
    setError("");
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-muted-foreground">No pending verification found.</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold">Email verified!</h1>
          <p className="text-muted-foreground">Redirecting to onboarding…</p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-4 rounded-2xl">
              <Mail className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground text-sm">
            We sent a 6-digit code to<br />
            <span className="font-semibold text-foreground">{email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={e => handleOtpChange(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleVerify(); }}
              className="text-center text-2xl tracking-[0.5em] h-14"
              maxLength={6}
              autoComplete="one-time-code"
            />
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
          </div>

          <Button
            className="w-full h-12"
            disabled={loading || otp.length !== 6}
            onClick={handleVerify}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying…</>
            ) : (
              <><span>Verify</span><ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendTimer > 0 || resending}
              className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
            >
              {resending
                ? "Sending…"
                : resendTimer > 0
                ? `Resend code in ${resendTimer}s`
                : "Resend code"}
            </button>
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(PENDING_SIGNUP_KEY);
              navigate("/");
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}