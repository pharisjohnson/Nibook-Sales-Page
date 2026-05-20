import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscribeNewsletter } from "@/hooks/use-newsletter";

export function FinalCta() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const subscribe = useSubscribeNewsletter();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    subscribe.mutate(email, {
      onSuccess: () => {
        toast({
          title: "You're on the list!",
          description: "We'll be in touch soon with more details.",
        });
        setEmail("");
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Oops!",
          description: err.message || "Failed to subscribe.",
        });
      }
    });
  };

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-primary text-white rounded-3xl p-10 md:p-16 shadow-2xl shadow-primary/20 border border-primary/20"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            Be among the first to use Nibook
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            We're looking for service professionals to try Nibook early, shape the product, and grow with us from day one.
          </p>
          
          <div className="flex flex-col items-center gap-6">
            <button 
              onClick={() => toast({ title: "Getting Started", description: "Opening registration..." })}
              className="px-8 py-4 rounded-full font-bold bg-accent text-accent-foreground shadow-xl shadow-accent/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 text-lg w-full sm:w-auto"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-sm text-primary-foreground/60">No Credit Card Required • Setup in 10 minutes</p>
          </div>

          {/* Demonstration of a fully wired form hook */}
          <div className="mt-16 pt-10 border-t border-white/10 max-w-md mx-auto">
            <p className="text-sm font-medium mb-4 text-primary-foreground/80">Not ready yet? Join our newsletter for business tips.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={subscribe.isPending}
                className="flex-1 px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={subscribe.isPending}
                className="px-6 py-3 rounded-xl font-bold bg-white text-primary hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {subscribe.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Subscribe"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
