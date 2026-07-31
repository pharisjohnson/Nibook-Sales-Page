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
import AuthVerifyPage from "@/pages/auth-verify";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import SubscriptionCallbackPage from "@/pages/subscription-callback";
import UpgradePage from "@/pages/upgrade";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/profile";
import DashboardHome from "@/pages/dashboard";
import ServicesPage from "@/pages/services";
import BookingsPage from "@/pages/bookings";
import AvailabilityPage from "@/pages/availability";
import TeamPage from "@/pages/team";
import SettingsPage from "@/pages/settings";
import AnalyticsPage from "@/pages/analytics";

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

function ProtectedDashboard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  if (loading || profileLoading) return <PageLoader />;
  if (!user) return <Redirect to="/" />;
  if (profile && !profile.onboarding_completed) return <Redirect to="/onboarding" />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function ProtectedOnboarding({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  if (loading || profileLoading) return <PageLoader />;
  if (!user) return <Redirect to="/" />;
  if (profile?.onboarding_completed) return <Redirect to="/dashboard" />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/directory" component={DirectoryPage} />
      <Route path="/book/:slug" component={BookingStorePage} />
      <Route path="/waitlist" component={WaitlistPage} />
      <Route path="/auth/verify" component={AuthVerifyPage} />
      <Route path="/subscription/callback" component={SubscriptionCallbackPage} />
      <Route path="/upgrade">
        <ProtectedDashboard><UpgradePage /></ProtectedDashboard>
      </Route>
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
