import { motion } from "framer-motion";
import { Clock, LogOut, AlertTriangle } from "lucide-react";
import { Pricing } from "@/components/landing/Pricing";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/profile";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export default function UpgradePage() {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const [, navigate] = useLocation();
  const [daysOverdue, setDaysOverdue] = useState(0);

  useEffect(() => {
    if (profile?.created_at) {
      const created = new Date(profile.created_at).getTime();
      const now = Date.now();
      const daysSinceCreation = Math.floor((now - created) / (24 * 60 * 60 * 1000));
      setDaysOverdue(Math.max(0, daysSinceCreation - 7));
    }
  }, [profile]);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  const deletionDay = daysOverdue >= 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <img src="/nibook-wordmark.png" alt="Nibook" className="h-10 w-auto" />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      {/* Trial ended banner */}
      <section className={`py-16 border-b ${deletionDay ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"}`}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${deletionDay ? "bg-red-100" : "bg-amber-100"}`}>
              {deletionDay ? <AlertTriangle className="w-8 h-8 text-red-600" /> : <Clock className="w-8 h-8 text-amber-600" />}
            </div>
            <h1 className={`text-3xl font-extrabold mb-3 ${deletionDay ? "text-red-900" : "text-foreground"}`}>
              {deletionDay ? "Your account will be deleted soon" : "Your free trial has ended"}
            </h1>
            <p className={`text-lg max-w-md mx-auto ${deletionDay ? "text-red-700" : "text-muted-foreground"}`}>
              {deletionDay
                ? "Your trial ended yesterday. Upgrade now to keep your data — otherwise your account and all your data will be permanently deleted today."
                : "Choose a plan to keep managing your bookings and accepting appointments — all your data is safe."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Reuse the pricing component */}
      <Pricing />
    </div>
  );
}
