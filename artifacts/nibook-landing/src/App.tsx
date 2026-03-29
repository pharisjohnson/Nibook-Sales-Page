import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardHome from "@/pages/dashboard";
import ServicesPage from "@/pages/services";
import BookingsPage from "@/pages/bookings";
import AvailabilityPage from "@/pages/availability";
import TeamPage from "@/pages/team";
import SettingsPage from "@/pages/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      
      <Route path="/dashboard">
        <DashboardLayout>
          <DashboardHome />
        </DashboardLayout>
      </Route>
      
      <Route path="/services">
        <DashboardLayout>
          <ServicesPage />
        </DashboardLayout>
      </Route>
      
      <Route path="/bookings">
        <DashboardLayout>
          <BookingsPage />
        </DashboardLayout>
      </Route>
      
      <Route path="/availability">
        <DashboardLayout>
          <AvailabilityPage />
        </DashboardLayout>
      </Route>

      <Route path="/team">
        <DashboardLayout>
          <TeamPage />
        </DashboardLayout>
      </Route>

      <Route path="/settings">
        <DashboardLayout>
          <SettingsPage />
        </DashboardLayout>
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
