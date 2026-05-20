import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, BookOpen, CreditCard, Users, Settings, Zap, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

interface FaqItem { q: string; a: string; }

function Accordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-border rounded-2xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-foreground hover:bg-muted/30 transition-colors gap-4"
          >
            <span className="text-sm">{item.q}</span>
            <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`} />
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4 bg-muted/10">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const SECTIONS = [
  {
    icon: BookOpen,
    title: "Getting started",
    color: "bg-primary/10 text-primary",
    items: [
      {
        q: "How do I set up my Nibook account?",
        a: "After signing up, you'll be guided through our onboarding flow. You'll set your business name and type, add your services and pricing, set your working hours, and publish your booking page — usually in under 10 minutes.",
      },
      {
        q: "What is a public booking page?",
        a: "Your public booking page is a unique link (e.g. nibook.noonstudio.africa/your-name) that you can share with clients. They can browse your services and book appointments without needing to message you.",
      },
      {
        q: "Can I try Nibook for free?",
        a: "Yes. The Starter plan includes a 7-day free trial. No credit card is required to start. You'll have access to all Starter features during the trial.",
      },
      {
        q: "Do my clients need to download an app?",
        a: "No. Your clients book through your public booking page in any web browser — no app download required.",
      },
      {
        q: "How do I share my booking link with clients?",
        a: "Go to your dashboard and copy your booking link from the top of the page. Share it via WhatsApp, Instagram bio, email signature, or anywhere else you communicate with clients.",
      },
    ],
  },
  {
    icon: CreditCard,
    title: "Payments & billing",
    color: "bg-amber-100 text-amber-600",
    items: [
      {
        q: "What payment methods does Nibook accept?",
        a: "We accept M-Pesa via STK push and card payments (Visa, Mastercard) through Paystack for your Nibook subscription. Your clients can pay for services as you configure.",
      },
      {
        q: "How does M-Pesa payment work?",
        a: "Enter your M-Pesa phone number and confirm the payment when a push notification appears on your phone. The STK push request expires after 60 seconds if not confirmed.",
      },
      {
        q: "Can I cancel my subscription?",
        a: "Yes, anytime. Go to Settings → Subscription and click Cancel Plan. Your access continues until the end of your current billing month. We don't charge cancellation fees.",
      },
      {
        q: "Do you offer refunds?",
        a: "We do not offer refunds for partial billing periods. If you cancel mid-month, you retain access until the billing period ends. If you experience a technical issue that prevented you from using the Service, contact us and we'll review your case.",
      },
      {
        q: "When will I be charged?",
        a: "After your 7-day free trial, your subscription renews monthly on the same date each month. You'll receive an email receipt after each successful charge.",
      },
    ],
  },
  {
    icon: Users,
    title: "Bookings & clients",
    color: "bg-sky-100 text-sky-600",
    items: [
      {
        q: "How do clients book an appointment?",
        a: "Clients visit your booking page, choose a service, pick an available time slot, enter their name and phone number, and confirm. They receive a confirmation automatically.",
      },
      {
        q: "Can I manually create a booking?",
        a: "Yes. From your Bookings dashboard, click 'New Booking' and fill in the client details, service, and time yourself. Useful for walk-ins or phone bookings.",
      },
      {
        q: "How do appointment reminders work?",
        a: "Nibook sends automatic WhatsApp reminders to your clients before their appointment. You can configure reminder timing in your Settings.",
      },
      {
        q: "What happens if a client cancels?",
        a: "Cancelled appointments are marked in your Bookings dashboard and the time slot becomes available again automatically.",
      },
      {
        q: "Can I block off time so clients can't book?",
        a: "Yes. Use the Availability page to set your working hours and block specific dates or times (e.g. holidays, personal time).",
      },
    ],
  },
  {
    icon: Zap,
    title: "Services & pricing",
    color: "bg-emerald-100 text-emerald-600",
    items: [
      {
        q: "How do I add a service?",
        a: "Go to Services in your dashboard, click 'Add Service', and enter the name, description, duration, and price. You can add as many services as you need.",
      },
      {
        q: "Can I have different durations for different services?",
        a: "Yes. Each service has its own duration setting. Nibook blocks the correct amount of time on your calendar when a booking is made.",
      },
      {
        q: "Can I set different prices for team members?",
        a: "This feature is on our roadmap. Currently all team members share service pricing. Submit a feature request if this is important to you.",
      },
    ],
  },
  {
    icon: Users,
    title: "Team management",
    color: "bg-purple-100 text-purple-600",
    items: [
      {
        q: "How do I add a team member?",
        a: "Go to Team in your dashboard and click 'Invite Member'. Enter their email address and they'll receive an invitation to join your Nibook workspace.",
      },
      {
        q: "What can team members do?",
        a: "Team members can manage their own bookings and availability. Owners have full access including billing and settings. More granular permissions are on our roadmap.",
      },
      {
        q: "How many team members can I have?",
        a: "The Starter plan includes 1 staff seat. The Premium plan supports up to 10 staff seats.",
      },
    ],
  },
  {
    icon: Settings,
    title: "Technical & account",
    color: "bg-rose-100 text-rose-600",
    items: [
      {
        q: "How do I change my email or password?",
        a: "Go to Settings → Account to update your email address or password.",
      },
      {
        q: "How do I delete my account?",
        a: "Go to Settings → Account and scroll to the bottom. Click 'Delete Account'. This will permanently delete all your data within 30 days. This action cannot be undone.",
      },
      {
        q: "What browsers does Nibook support?",
        a: "Nibook works on all modern browsers — Chrome, Safari, Firefox, and Edge. We recommend keeping your browser updated for the best experience.",
      },
      {
        q: "Is my data backed up?",
        a: "Yes. Your data is stored on InsForge's hosted PostgreSQL database with automatic daily backups.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar />

      <section className="pt-28 pb-14 bg-muted/30 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-5">Help Center</span>
            <h1 className="text-4xl font-extrabold text-foreground mb-3">How can we help?</h1>
            <p className="text-muted-foreground">Answers to common questions about using Nibook.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          {SECTIONS.map((section, i) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
                </div>
                <Accordion items={section.items} />
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Still need help */}
      <section className="py-16 bg-muted/30 border-t border-border">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <MessageCircle className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Still have questions?</h2>
            <p className="text-muted-foreground mb-6">Our team responds within 24 hours on weekdays.</p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Contact support
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
