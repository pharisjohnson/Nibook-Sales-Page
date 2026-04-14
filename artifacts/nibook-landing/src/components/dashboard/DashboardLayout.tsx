import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Scissors, CalendarDays, Clock, Users, Settings, Calendar, Menu, BarChart3 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
          <Link href="/dashboard" className="flex items-center gap-2 mb-4">
            <div className="bg-primary text-white p-1.5 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">Nibook</span>
          </Link>
          <div className="px-1">
            <p className="font-semibold text-sm">Amina's Beauty Studio</p>
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
          <div className="bg-muted rounded-xl p-4 flex flex-col items-center text-center space-y-3">
            <Badge variant="outline" className="bg-background">Free Plan</Badge>
            <p className="text-xs text-muted-foreground">Get more features with Pro.</p>
            <Link href="/#pricing">
              <Button className="w-full" size="sm">Upgrade to Pro</Button>
            </Link>
          </div>

          <div className="flex items-center gap-3 px-2">
            <Avatar>
              <AvatarImage src="https://i.pravatar.cc/150?u=amina" />
              <AvatarFallback>AK</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Amina K.</p>
              <p className="text-xs text-muted-foreground truncate">amina@example.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 max-w-full">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-white p-1 rounded-md">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg">Nibook</span>
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
