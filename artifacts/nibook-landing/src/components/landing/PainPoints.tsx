import { motion } from "framer-motion";
import { MessageCircleOff, CalendarOff, LineChart, UsersRound } from "lucide-react";

export function PainPoints() {
  const painPoints = [
    {
      icon: <CalendarOff className="w-6 h-6 text-destructive" />,
      title: "Clients keep asking 'Are you available?'",
      description: "You spend hours every week going back and forth just to find a time that works for everyone."
    },
    {
      icon: <MessageCircleOff className="w-6 h-6 text-destructive" />,
      title: "Forgot to remind them, and they no-showed",
      description: "Empty slots mean lost income. Manually sending reminders on WhatsApp is tedious and easily forgotten."
    },
    {
      icon: <LineChart className="w-6 h-6 text-destructive" />,
      title: "No idea what makes you the most money",
      description: "At the end of the month, you don't have clear data on your top services or true revenue."
    },
    {
      icon: <UsersRound className="w-6 h-6 text-destructive" />,
      title: "Team coordination is a WhatsApp nightmare",
      description: "Managing a team of stylists or consultants in a group chat leads to double bookings and confusion."
    }
  ];

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Sound familiar?</h2>
          <p className="mt-4 text-lg text-muted-foreground">Running a service business is hard enough. Managing the admin work shouldn't be the hardest part.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {painPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-muted/30 border border-border/50 rounded-2xl p-8 hover:bg-muted/50 transition-colors"
            >
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mb-6">
                {point.icon}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{point.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{point.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-2xl font-bold text-primary">Nibook was built to solve exactly these problems.</p>
        </motion.div>
      </div>
    </section>
  );
}
