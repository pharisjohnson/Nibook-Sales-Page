import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Hero() {
  const { toast } = useToast();

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[80px]" />
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-accent/10 blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-8 border border-primary/20"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Built for African Service Professionals
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground tracking-tight text-balance max-w-4xl"
        >
          Your Business, Booked. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Managed. Thriving.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl text-balance leading-relaxed"
        >
          Stop chasing clients with WhatsApp messages. Nibook gives you a professional booking page, automatic reminders, and full business control — all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <button 
            onClick={() => toast({ title: "Redirecting...", description: "Opening signup flow." })}
            className="w-full sm:w-auto px-8 py-4 rounded-full font-bold bg-primary text-white shadow-xl shadow-primary/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            Start for Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold bg-white text-foreground border-2 border-border hover:border-primary/50 hover:bg-muted/50 transition-all duration-300"
          >
            See How It Works
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-1 text-accent">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 fill-current" />
            ))}
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            <span className="text-foreground font-bold">500+</span> service providers | <span className="text-foreground font-bold">KES 2M+</span> in bookings
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 w-full max-w-5xl relative perspective-[1000px]"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border border-border/50 bg-white p-2">
            <img 
              src={`${import.meta.env.BASE_URL}images/hero-mockup.png`} 
              alt="Nibook Dashboard Preview" 
              className="w-full h-auto rounded-xl border border-border/50"
            />
            {/* Glossy reflection overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none rounded-2xl" />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
