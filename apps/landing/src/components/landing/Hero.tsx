import { motion } from "framer-motion";
import { ArrowRight, Star, TrendingUp, CalendarCheck, Users } from "lucide-react";
import { useState } from "react";
import { AuthModal } from "./AuthModal";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

export function Hero() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-[#F8FAFF]">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] rounded-full bg-accent/8 blur-[100px]" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] rounded-full bg-[#4CB963]/6 blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

          {/* ── Left: Text Content ── */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl">

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Built for African Service Professionals
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.08]"
            >
              Your Business,{" "}
              <span className="text-primary">Booked.</span>
              <br />
              <span className="text-accent">Managed.</span>{" "}
              <span className="text-[#4CB963]">Thriving.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-5 text-base md:text-lg text-muted-foreground max-w-md leading-relaxed"
            >
              Stop chasing clients with WhatsApp messages. Nibook gives you a professional booking page, automatic reminders, and full business control — all in one place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
            >
              <button
                onClick={() => user ? navigate("/dashboard") : setShowAuth(true)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full font-bold bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 group text-base"
              >
                {user ? "Go to Dashboard" : "Start for Free"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full font-semibold bg-white text-foreground border-2 border-border hover:border-primary/40 hover:bg-white transition-all duration-300 text-base"
              >
                See How It Works
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="mt-8 flex flex-col items-center lg:items-start gap-2"
            >
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4"
            >
              {[
                { icon: <CalendarCheck className="w-4 h-4" />, text: "No contracts" },
                { icon: <Users className="w-4 h-4" />, text: "Free 7-day trial" },
                { icon: <TrendingUp className="w-4 h-4" />, text: "Set up in 5 min" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                  <span className="text-[#4CB963]">{icon}</span>
                  {text}
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right: Dashboard Screenshots ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex-1 relative w-full max-w-2xl lg:max-w-none"
          >
            <div className="relative">

              {/* Desktop screenshot — main card */}
              <div className="relative rounded-2xl overflow-hidden shadow-[0_32px_80px_-12px_rgba(0,102,204,0.22)] border border-white/80 bg-white ml-0 lg:ml-4">
                {/* Browser chrome bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-3 bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-400 font-mono">
                    app.nibook.africa/dashboard
                  </div>
                </div>
                <img
                  src={`${import.meta.env.BASE_URL}images/dashboard-desktop.png`}
                  alt="Nibook Dashboard — Desktop"
                  className="w-full h-auto block"
                />
                {/* Glossy sheen */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Mobile screenshot — floating card */}
              <motion.div
                initial={{ opacity: 0, y: 20, rotate: 2 }}
                animate={{ opacity: 1, y: 0, rotate: 2 }}
                transition={{ duration: 0.7, delay: 0.7 }}
                className="absolute -bottom-10 -left-6 lg:-left-10 w-[130px] sm:w-[155px] lg:w-[175px] rounded-[22px] overflow-hidden shadow-[0_20px_60px_-8px_rgba(0,0,0,0.25)] border-[3px] border-white ring-1 ring-gray-100 bg-white"
                style={{ rotate: "2deg" }}
              >
                {/* Phone notch */}
                <div className="h-5 bg-gray-900 flex items-center justify-center">
                  <div className="w-12 h-1 rounded-full bg-gray-700" />
                </div>
                <img
                  src={`${import.meta.env.BASE_URL}images/dashboard-mobile.png`}
                  alt="Nibook Dashboard — Mobile"
                  className="w-full h-auto block"
                />
                <div className="h-4 bg-gray-900" />
              </motion.div>

              {/* Floating stat badge — Revenue */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="absolute -top-5 -right-4 lg:-right-8 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-[#4CB963]/15 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-[#4CB963]" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium leading-none mb-1">Revenue this month</p>
                  <p className="text-sm font-bold text-foreground leading-none">KES 34,200</p>
                  <p className="text-[10px] text-[#4CB963] font-semibold mt-0.5">↑ +12%</p>
                </div>
              </motion.div>

              {/* Floating stat badge — Bookings */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.05 }}
                className="absolute bottom-6 right-0 lg:-right-6 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium leading-none mb-1">Upcoming today</p>
                  <p className="text-sm font-bold text-foreground leading-none">3 bookings</p>
                  <p className="text-[10px] text-primary font-semibold mt-0.5">Next in 2 hours</p>
                </div>
              </motion.div>

            </div>
          </motion.div>
        </div>
      </div>
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        defaultTab="signup"
      />
    </section>
  );
}
