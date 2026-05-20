import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

const EFFECTIVE_DATE = "20 May 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>
      <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar />

      <section className="pt-28 pb-14 bg-muted/30 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-5">Legal</span>
            <h1 className="text-4xl font-extrabold text-foreground mb-3">Privacy Policy</h1>
            <p className="text-muted-foreground">Effective date: {EFFECTIVE_DATE}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>

            <p className="text-muted-foreground mb-10 leading-relaxed">
              Nibook Inc. ("Nibook", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, share, and protect information about you when you use our platform at <strong>nibook.noonstudio.africa</strong> and related services (collectively, the "Service"). By using the Service, you agree to the practices described below.
            </p>

            <Section title="1. Information we collect">
              <p><strong className="text-foreground">Account information:</strong> When you sign up, we collect your name, email address, business name, and profession type.</p>
              <p><strong className="text-foreground">Business and booking data:</strong> We store the services you list, your availability settings, appointment bookings, and client contact information you enter into the platform.</p>
              <p><strong className="text-foreground">Payment information:</strong> We do not store your full payment card details. Payments are processed by Paystack and M-Pesa via PayHero. We receive transaction references, amounts, and status updates from these providers.</p>
              <p><strong className="text-foreground">Usage data:</strong> We collect information about how you interact with the Service — pages visited, features used, and session duration — to improve the product.</p>
              <p><strong className="text-foreground">Device and technical data:</strong> IP address, browser type, operating system, and error logs collected automatically when you use the Service.</p>
            </Section>

            <Section title="2. How we use your information">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Provide, operate, and improve the Nibook platform.</li>
                <li>Process payments and send billing receipts.</li>
                <li>Send appointment reminders and notifications to you and your clients.</li>
                <li>Respond to your support requests and feedback.</li>
                <li>Monitor platform health, diagnose errors, and prevent abuse.</li>
                <li>Send product updates and promotional communications (you may opt out at any time).</li>
              </ul>
            </Section>

            <Section title="3. How we share your information">
              <p>We do not sell your personal data. We share your information only with:</p>
              <p><strong className="text-foreground">InsForge</strong> — our database and authentication infrastructure provider. Your data is stored on InsForge-hosted servers in the US East region.</p>
              <p><strong className="text-foreground">Paystack</strong> — payment processing for subscription plans. Subject to <a href="https://paystack.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Paystack's Privacy Policy</a>.</p>
              <p><strong className="text-foreground">PayHero</strong> — M-Pesa STK push processing. Subject to PayHero's privacy terms.</p>
              <p><strong className="text-foreground">PostHog</strong> — product analytics. Anonymised usage data only.</p>
              <p><strong className="text-foreground">Sentry</strong> — error monitoring. Error reports may include device and session context.</p>
              <p><strong className="text-foreground">Legal obligations:</strong> We may disclose your information if required by law or to protect the rights and safety of Nibook or its users.</p>
            </Section>

            <Section title="4. Data retention">
              <p>We retain your account and business data for as long as your account is active. If you delete your account, we will delete or anonymise your personal data within 30 days, except where we are required to retain it by law (e.g. financial records for tax purposes, which we retain for 7 years in compliance with Kenyan law).</p>
            </Section>

            <Section title="5. Your rights">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong className="text-foreground">Access</strong> the personal data we hold about you.</li>
                <li><strong className="text-foreground">Correct</strong> inaccurate or incomplete data.</li>
                <li><strong className="text-foreground">Delete</strong> your account and associated data.</li>
                <li><strong className="text-foreground">Object</strong> to processing your data for direct marketing.</li>
                <li><strong className="text-foreground">Data portability</strong> — request a copy of your data in a machine-readable format.</li>
              </ul>
              <p>To exercise these rights, email us at <a href="mailto:privacy@nibook.co" className="text-primary hover:underline">privacy@nibook.co</a>.</p>
            </Section>

            <Section title="6. Security">
              <p>We implement industry-standard security measures including HTTPS encryption, access controls, and row-level security on our database. No method of transmission over the internet is 100% secure; we cannot guarantee absolute security, but we take our responsibility to protect your data seriously.</p>
            </Section>

            <Section title="7. Cookies">
              <p>We use essential cookies to keep you logged in and maintain your session. We also use analytics cookies (PostHog) to understand how the platform is used. You may disable cookies in your browser settings, though this may affect functionality.</p>
            </Section>

            <Section title="8. Children's privacy">
              <p>The Service is not directed at children under 18. We do not knowingly collect personal data from children. If you believe a child has provided us with their data, please contact us immediately.</p>
            </Section>

            <Section title="9. Changes to this policy">
              <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notice. Your continued use of the Service after changes take effect constitutes your acceptance of the updated policy.</p>
            </Section>

            <Section title="10. Contact us">
              <p>For any privacy-related questions or requests:</p>
              <p>Email: <a href="mailto:privacy@nibook.co" className="text-primary hover:underline">privacy@nibook.co</a></p>
              <p>Nibook Inc., Nairobi, Kenya</p>
            </Section>

          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
