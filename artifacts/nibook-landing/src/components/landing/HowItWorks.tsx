import { motion } from "framer-motion";
import { UserPlus, Share2, CalendarCheck } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: <UserPlus className="w-8 h-8 text-primary" />,
      title: "Create Your Profile",
      description: "Sign up and add your business name, operating hours, services, and pricing in less than 5 minutes."
    },
    {
      icon: <Share2 className="w-8 h-8 text-primary" />,
      title: "Share Your Link",
      description: "Get your unique booking URL. Add it to your Instagram bio, WhatsApp catalog, or anywhere online."
    },
    {
      icon: <CalendarCheck className="w-8 h-8 text-primary" />,
      title: "Watch Bookings Come In",
      description: "Clients book themselves. They get reminders, you get notified, and your business practically runs itself."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Up and running in 10 minutes</h2>
          <p className="mt-4 text-lg text-muted-foreground">It's incredibly simple to migrate to Nibook. No technical skills required.</p>
        </motion.div>

        <div className="relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10" />

          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-24 h-24 bg-white rounded-full border-4 border-primary/20 flex items-center justify-center mb-6 relative group-hover:border-primary group-hover:scale-110 transition-all duration-300 shadow-xl shadow-primary/10">
                  {/* Step number badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full font-bold flex items-center justify-center shadow-lg">
                    {index + 1}
                  </div>
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
