import { motion } from "framer-motion";
import { Quote } from "lucide-react";

export function Testimonials() {
  const testimonials = [
    {
      quote: "Before Nibook I was managing 30 clients on WhatsApp. It was pure chaos. Now everything is automatic and I can just focus on doing hair!",
      author: "Amina K.",
      role: "Hair Stylist",
      location: "Nairobi, Kenya",
      color: "bg-blue-100 text-blue-700"
    },
    {
      quote: "My coaching clients can book a call anytime without asking me first. The analytics dashboard shows me exactly which packages sell best.",
      author: "David M.",
      role: "Business Coach",
      location: "Kampala, Uganda",
      color: "bg-amber-100 text-amber-700"
    },
    {
      quote: "No-shows completely dropped after we turned on the automatic WhatsApp reminders. Honestly the best investment for my salon this year.",
      author: "Grace N.",
      role: "Salon Owner",
      location: "Dar es Salaam, TZ",
      color: "bg-emerald-100 text-emerald-700"
    }
  ];

  return (
    <section id="testimonials" className="py-24 bg-primary text-white overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold">Loved by service professionals across East Africa</h2>
          <p className="mt-4 text-lg text-primary-foreground/80">Don't just take our word for it. Here's what our community says.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 flex flex-col justify-between"
            >
              <div>
                <Quote className="w-10 h-10 text-accent mb-6 opacity-80" />
                <p className="text-lg leading-relaxed mb-8">"{t.quote}"</p>
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${t.color}`}>
                  {t.author.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold">{t.author}</h4>
                  <p className="text-sm text-primary-foreground/70">{t.role}, {t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
