import { motion } from "framer-motion";
import { Clock, LogOut } from "lucide-react";
import { Pricing } from "@/components/landing/Pricing";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

export default function UpgradePage() {
  const { signOut } = useAuth();
  const [, navigate] = useLocation();

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

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
      <section className="py-16 bg-amber-50 border-b border-amber-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-5">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-foreground mb-3">Your free trial has ended</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Choose a plan to keep managing your bookings and accepting appointments — all your data is safe.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Reuse the pricing component */}
      <Pricing />
    </div>
  );
}
