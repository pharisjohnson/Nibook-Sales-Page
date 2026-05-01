import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import DirectoryPage from "@/pages/directory";
import BookingStorePage from "@/pages/booking-store";
import WaitlistPage from "@/pages/waitlist";
import OnboardingPage from "@/pages/onboarding";

import VisitorCheckIn from "@/pages/visitor-checkin";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/lib/auth";
import DashboardHome from "@/pages/dashboard";
import ServicesPage from "@/pages/services";
import BookingsPage from "@/pages/bookings";
import AvailabilityPage from "@/pages/availability";
import TeamPage from "@/pages/team";
import SettingsPage from "@/pages/settings";
import AnalyticsPage from "@/pages/analytics";

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
  if (loading) return null;
  if (!user) return <Redirect to="/" />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/directory" component={DirectoryPage} />
      <Route path="/book/:slug" component={BookingStorePage} />
      <Route path="/waitlist" component={WaitlistPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/check-in" component={VisitorCheckIn} />

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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
