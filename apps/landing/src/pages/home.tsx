import { useSeo } from "@/hooks/use-seo";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { PainPoints } from "@/components/landing/PainPoints";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { FinalCta } from "@/components/landing/Cta";
import { Footer } from "@/components/landing/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function SectionErrorFallback({ title }: { title: string }) {
  return (
    <div className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-muted-foreground">Unable to load {title}. Please refresh the page.</p>
      </div>
    </div>
  );
}

export default function Home() {
  useSeo({
    title: "Online Booking for Service Businesses in Kenya",
    description: "Get your free booking page in minutes. Manage bookings, clients and M-Pesa payments — built for salons, spas, barbershops and service businesses across Kenya.",
    url: "/",
  });
  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main>
        <ErrorBoundary>
          <Hero />
        </ErrorBoundary>
        <ErrorBoundary fallback={<SectionErrorFallback title="pain points section" />}>
          <PainPoints />
        </ErrorBoundary>
        <ErrorBoundary fallback={<SectionErrorFallback title="features section" />}>
          <Features />
        </ErrorBoundary>
        <ErrorBoundary fallback={<SectionErrorFallback title="how it works section" />}>
          <HowItWorks />
        </ErrorBoundary>
        <ErrorBoundary fallback={<SectionErrorFallback title="testimonials section" />}>
          <Testimonials />
        </ErrorBoundary>
        <ErrorBoundary fallback={<SectionErrorFallback title="pricing section" />}>
          <Pricing />
        </ErrorBoundary>
        <ErrorBoundary fallback={<SectionErrorFallback title="call to action section" />}>
          <FinalCta />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
