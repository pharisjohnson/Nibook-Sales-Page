import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import DirectoryPage from "@/pages/directory";
import BookingStorePage from "@/pages/booking-store";
import WaitlistPage from "@/pages/waitlist";
import OnboardingPage from "@/pages/onboarding";
import FeedbackPage from "@/pages/feedback";
import ReferralPage from "@/pages/referral";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import HelpPage from "@/pages/help";
import ContactPage from "@/pages/contact";
import ReviewsPage from "@/pages/reviews";
import FeatureRequestsPage from "@/pages/feature-requests";
import UpgradePage from "@/pages/upgrade";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import SubscriptionCallbackPage from "@/pages/subscription-callback";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/profile";
import DashboardHome from "@/pages/dashboard";
import ServicesPage from "@/pages/services";
import BookingsPage from "@/pages/bookings";
import AvailabilityPage from "@/pages/availability";
import TeamPage from "@/pages/team";
import SettingsPage from "@/pages/settings";
import AnalyticsPage from "@/pages/analytics";
import LoginPage from "@/pages/auth/login";
import SignupPage from "@/pages/auth/signup";
import LegacySlugRedirect from "@/pages/legacy-slug-redirect";
import { ROUTES } from "@/lib/routes";

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const TRIAL_DAYS = 7;

function isTrialExpired(createdAt: string) {
  const trialEndsAt = new Date(createdAt).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() > trialEndsAt;
}

function ProtectedDashboard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  if (loading || profileLoading) return <PageLoader />;
  if (!user) return <Redirect to="/" />;
  if (!profile?.onboarding_completed) return <Redirect to={ROUTES.onboarding} />;
  const isPaid = profile.plan === "starter" || profile.plan === "premium";
  if (!isPaid && isTrialExpired(profile.created_at)) return <Redirect to="/upgrade" />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function ProtectedOnboarding({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  if (loading || profileLoading) return <PageLoader />;
  if (!user) return <Redirect to="/" />;
  if (profile?.onboarding_completed) return <Redirect to={ROUTES.dashboard.home} />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/directory" component={DirectoryPage} />
      <Route path="/waitlist" component={WaitlistPage} />
      <Route path="/subscription/callback" component={SubscriptionCallbackPage} />
      <Route path="/feedback" component={FeedbackPage} />
      <Route path="/referral" component={ReferralPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/help" component={HelpPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/reviews" component={ReviewsPage} />
      <Route path="/feature-requests" component={FeatureRequestsPage} />
      <Route path="/upgrade" component={UpgradePage} />
      <Route path={ROUTES.auth.login} component={LoginPage} />
      <Route path={ROUTES.auth.signup} component={SignupPage} />
      <Route path="/b/:slug" component={BookingStorePage} />
      <Route path="/onboarding">
        <ProtectedOnboarding><OnboardingPage /></ProtectedOnboarding>
      </Route>

      <Route path="/dashboard">
        <ProtectedDashboard><DashboardHome /></ProtectedDashboard>
      </Route>
      <Route path="/services">
        <ProtectedDashboard><ServicesPage /></ProtectedDashboard>
      </Route>
      <Route path="/bookings">
        <ProtectedDashboard><BookingsPage /></ProtectedDashboard>
      </Route>
      <Route path="/availability">
        <ProtectedDashboard><AvailabilityPage /></ProtectedDashboard>
      </Route>
      <Route path="/team">
        <ProtectedDashboard><TeamPage /></ProtectedDashboard>
      </Route>
      <Route path="/settings">
        <ProtectedDashboard><SettingsPage /></ProtectedDashboard>
      </Route>
      <Route path="/analytics">
        <ProtectedDashboard><AnalyticsPage /></ProtectedDashboard>
      </Route>

      <Route path="/:slug" component={LegacySlugRedirect} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
