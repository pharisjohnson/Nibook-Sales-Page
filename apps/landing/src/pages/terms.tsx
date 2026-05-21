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

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar />

      <section className="pt-36 pb-28 bg-muted/30 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-5">Legal</span>
            <h1 className="text-4xl font-extrabold text-foreground mb-3">Terms of Service</h1>
            <p className="text-muted-foreground">Effective date: {EFFECTIVE_DATE}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>

            <p className="text-muted-foreground mb-10 leading-relaxed">
              These Terms of Service ("Terms") govern your access to and use of the Nibook platform ("Service") provided by Nibook Inc. ("Nibook", "we", "us"). By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
            </p>

            <Section title="1. The Service">
              <p>Nibook is an appointment booking and business management platform designed for service professionals in East Africa. We provide tools for managing services, accepting bookings, processing payments, and communicating with clients.</p>
              <p>The Service is provided on a subscription basis. Features available to you depend on your subscription plan.</p>
            </Section>

            <Section title="2. Account registration">
              <p>You must create an account to use the Service. You agree to provide accurate and complete information and to keep your account credentials secure. You are responsible for all activity that occurs under your account.</p>
              <p>You must be at least 18 years of age to create an account. By creating an account, you represent that you meet this requirement.</p>
              <p>We reserve the right to suspend or terminate accounts that violate these Terms or that we believe are being used fraudulently.</p>
            </Section>

            <Section title="3. Subscriptions and billing">
              <p><strong className="text-foreground">Free trial:</strong> The Starter plan includes a 7-day free trial. No payment information is required to begin your trial. At the end of the trial period, you will need to subscribe to continue using the Service.</p>
              <p><strong className="text-foreground">Subscription fees:</strong> Subscription fees are charged monthly in Kenyan Shillings (KES) via Paystack. Current pricing is listed on our Pricing page. We may change pricing at any time with 30 days' notice.</p>
              <p><strong className="text-foreground">M-Pesa payments:</strong> You may also pay via M-Pesa through our PayHero integration. STK push requests expire after 60 seconds if not confirmed on your handset.</p>
              <p><strong className="text-foreground">Cancellation:</strong> You may cancel your subscription at any time from your account Settings page. Your access continues until the end of the current billing period. We do not offer refunds for partial billing periods.</p>
              <p><strong className="text-foreground">Failed payments:</strong> If a payment fails, we will notify you and attempt to process it again. After three failed attempts within 7 days, your account will be downgraded and access to paid features will be suspended.</p>
            </Section>

            <Section title="4. Acceptable use">
              <p>You agree not to use the Service to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Violate any applicable law or regulation.</li>
                <li>Collect or harvest personal data from other users without their consent.</li>
                <li>Send spam, phishing messages, or unsolicited communications through the platform.</li>
                <li>Upload malware, viruses, or any code designed to disrupt the Service.</li>
                <li>Attempt to gain unauthorised access to our systems or another user's account.</li>
                <li>Resell, sublicense, or white-label the Service without written authorisation from Nibook.</li>
                <li>Use the Service for any purpose that is unlawful, defamatory, or harmful to others.</li>
              </ul>
            </Section>

            <Section title="5. Your data and content">
              <p>You retain ownership of all data and content you upload to the Service ("Your Content"). By using the Service, you grant Nibook a limited, non-exclusive licence to store and process Your Content solely to provide the Service to you.</p>
              <p>You are responsible for ensuring that Your Content and your use of the Service comply with all applicable laws, including data protection laws applicable in Kenya and the jurisdictions of your clients.</p>
            </Section>

            <Section title="6. Intellectual property">
              <p>The Nibook name, logo, platform design, and software are the intellectual property of Nibook Inc. These Terms do not grant you any rights to our intellectual property except the limited right to use the Service as described herein.</p>
            </Section>

            <Section title="7. Uptime and availability">
              <p>We aim to provide a reliable Service but do not guarantee uninterrupted availability. The Service is provided on an "as is" and "as available" basis. We may perform scheduled maintenance with advance notice where possible.</p>
            </Section>

            <Section title="8. Limitation of liability">
              <p>To the maximum extent permitted by applicable law, Nibook and its directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the Service.</p>
              <p>Our total liability to you for any claim arising out of or relating to these Terms or the Service shall not exceed the total fees you paid to Nibook in the three months preceding the claim.</p>
            </Section>

            <Section title="9. Indemnification">
              <p>You agree to indemnify and hold harmless Nibook Inc. and its officers, directors, and employees from and against any claims, damages, losses, and expenses (including legal fees) arising from your use of the Service, your violation of these Terms, or your infringement of any third-party rights.</p>
            </Section>

            <Section title="10. Governing law and disputes">
              <p>These Terms are governed by the laws of the Republic of Kenya. Any disputes arising under these Terms shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to the jurisdiction of the courts of Nairobi, Kenya.</p>
            </Section>

            <Section title="11. Changes to these Terms">
              <p>We may modify these Terms at any time. We will notify you of material changes via email or in-app notice at least 14 days before changes take effect. Continued use of the Service after that date constitutes your acceptance of the updated Terms.</p>
            </Section>

            <Section title="12. Contact">
              <p>If you have questions about these Terms, contact us at:</p>
              <p>Email: <a href="mailto:legal@nibook.co" className="text-primary hover:underline">legal@nibook.co</a></p>
              <p>Nibook Inc., Nairobi, Kenya</p>
            </Section>

          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
