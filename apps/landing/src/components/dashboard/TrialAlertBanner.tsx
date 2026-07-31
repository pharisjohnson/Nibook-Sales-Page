import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Clock, AlertTriangle, X } from "lucide-react";
import { useProfile } from "@/lib/profile";
import { apiFetch, getStoredToken } from "@/lib/api";
import { Button } from "@/components/ui/button";

const TRIAL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Amber/red banner shown inside the dashboard when the 7-day free trial is
 * about to end (3 days or fewer left) or has already ended. Fires the
 * server-side remind endpoint once per stage so the user also gets the
 * upgrade email (the server dedupes via R2 markers).
 */
export default function TrialAlertBanner() {
  const { profile } = useProfile();
  const [dismissed, setDismissed] = useState(false);
  const [remindSent, setRemindSent] = useState(false);

  const status = useMemo(() => {
    if (!profile?.created_at) return null;
    const paid = profile.subscription_status === "active" || !!profile.plan;
    if (paid) return null;
    const created = new Date(profile.created_at).getTime();
    const endsAt = created + TRIAL_DAYS * DAY_MS;
    const msLeft = endsAt - Date.now();
    const daysLeft = Math.ceil(msLeft / DAY_MS);
    const expired = msLeft <= 0;
    if (!expired && daysLeft > 3) return null;
    return { daysLeft: Math.max(daysLeft, 0), expired };
  }, [profile]);

  useEffect(() => {
    if (!status || remindSent) return;
    setRemindSent(true);
    const token = getStoredToken();
    if (!token) return;
    // Fire-and-forget: server dedupes per stage, so calling on every visit is safe.
    apiFetch("/trial/remind", { method: "POST", body: "{}" }).catch(() => {});
  }, [status, remindSent]);

  if (!status || dismissed) return null;

  return (
    <div className={`mb-6 rounded-xl border px-4 py-3 flex items-start gap-3 ${status.expired ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
      {status.expired ? (
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
      ) : (
        <Clock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
      )}
      <div className="flex-1">
        <p className={`text-sm font-semibold ${status.expired ? "text-red-800" : "text-amber-800"}`}>
          {status.expired ? "Your free trial has ended" : `Your free trial ends in ${status.daysLeft} day${status.daysLeft === 1 ? "" : "s"}`}
        </p>
        <p className={`text-sm mt-0.5 ${status.expired ? "text-red-700" : "text-amber-700"}`}>
          {status.expired
            ? "Upgrade now to keep your booking page live and your data safe."
            : "Upgrade now so your booking page keeps running without interruption."}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/upgrade">
          <Button size="sm" className={status.expired ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}>
            Upgrade
          </Button>
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
