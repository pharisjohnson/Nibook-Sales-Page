import { motion } from "framer-motion";
import { Link2, BellRing, Wallet, BarChart3, Users, CalendarDays } from "lucide-react";

export function Features() {
  const features = [
    {
      icon: <Link2 className="w-6 h-6 text-primary" />,
      title: "Smart Booking Page",
      description: "Get your own branded link that clients can use 24/7. No more back-and-forth texts to find an open slot."
    },
    {
      icon: <BellRing className="w-6 h-6 text-primary" />,
      title: "Automatic Reminders",
      description: "WhatsApp and email reminders are sent automatically. Reduce your no-shows by up to 60% effortlessly."
    },
    {
      icon: <Wallet className="w-6 h-6 text-primary" />,
      title: "M-Pesa & Multiple Payments",
      description: "Accept M-Pesa, bank transfers, or log in-person cash payments to keep all your finances in one place."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-primary" />,
      title: "Business Analytics",
      description: "See your daily revenue, identify top-performing services, and track completion rates at a glance."
    },
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: "Team Management",
      description: "Add staff members, assign specific roles, and coordinate your entire team's calendar from one dashboard."
    },
    {
      icon: <CalendarDays className="w-6 h-6 text-primary" />,
      title: "Availability Control",
      description: "Set your working hours, breaks, and custom booking rules. Nibook handles the scheduling logic for you."
    }
  ];

  return (
    <section id="features" className="py-24 bg-muted/30 border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Everything you need to run your service business</h2>
          <p className="mt-4 text-lg text-muted-foreground">A complete toolkit designed specifically for the needs of professionals in East Africa.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-border/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
