import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/profile";

type Status = "verifying" | "success" | "failed";

export default function SubscriptionCallbackPage() {
  const [, navigate] = useLocation();
  const { refresh: refreshProfile } = useProfile();
  const [status, setStatus] = useState<Status>("verifying");
  const [plan, setPlan] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") ?? params.get("trxref");

    if (!reference) {
      setStatus("failed");
      setMessage("No payment reference found. If you completed payment, contact support.");
      return;
    }

    fetch(`/api/subscriptions/verify/${encodeURIComponent(reference)}`)
      .then(r => r.json())
      .then((data: { success: boolean; paid?: boolean; plan?: string; message?: string }) => {
        if (data.success && data.paid) {
          setStatus("success");
          setPlan(data.plan ?? null);
          refreshProfile();
        } else {
          setStatus("failed");
          setMessage(data.message ?? "Payment could not be confirmed.");
        }
      })
      .catch(() => {
        setStatus("failed");
        setMessage("Could not reach the server. Your payment may still have gone through — check your email.");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "verifying" && (
          <>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Confirming your payment…</h1>
              <p className="text-muted-foreground text-sm">This will only take a moment.</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-green-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">You're all set!</h1>
              <p className="text-muted-foreground text-sm">
                {plan
                  ? `Your ${plan} subscription is now active. Welcome to Nibook!`
                  : "Your subscription is now active. Welcome to Nibook!"}
              </p>
            </div>
            <Button className="w-full" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-9 h-9 text-red-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Payment not confirmed</h1>
              <p className="text-muted-foreground text-sm">{message}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
                Back to home
              </Button>
              <Button className="flex-1" onClick={() => navigate("/#pricing")}>
                Try again
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
