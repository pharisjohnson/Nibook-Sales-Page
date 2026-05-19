import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Scissors, CalendarDays, Clock, Users, Settings, Calendar, Menu, BarChart3, Rocket, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/profile";

const navLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Services", href: "/services", icon: Scissors },
  { name: "Bookings", href: "/bookings", icon: CalendarDays },
  { name: "Availability", href: "/availability", icon: Clock },
  { name: "Team", href: "/team", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  const displayName = profile?.business_name || (user as any)?.user_metadata?.business_name || "My Business";
  const displayEmail = user?.email ?? "";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b">
          <Link href="/dashboard" className="flex items-center mb-4">
            <img src="/nibook-wordmark.png" alt="Nibook" className="h-14 w-auto" />
          </Link>
          <div className="px-1">
            <p className="font-semibold text-sm truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground">Admin Portal</p>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            const Icon = link.icon;
            return (
              <Link key={link.name} href={link.href}>
                <span
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {link.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t space-y-4">
          {/* Beta / Waitlist CTA */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col items-center text-center space-y-2">
            <Badge className="bg-primary/20 text-primary border-0 text-xs font-semibold">Beta — Free Access</Badge>
            <p className="text-xs text-muted-foreground leading-relaxed">Pro features coming soon. Join the waitlist for early access.</p>
            <Link href="/waitlist" className="w-full">
              <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary hover:text-white transition-colors">
                <Rocket className="w-3.5 h-3.5" />
                Join Waitlist
              </Button>
            </Link>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 px-2">
            <Avatar>
              <AvatarImage src={profile?.logo_url ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
            </div>
          </div>

          {/* Sign out button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 max-w-full">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-30">
          <div className="flex items-center">
            <img src="/nibook-wordmark.png" alt="Nibook" className="h-12 w-auto" />
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
