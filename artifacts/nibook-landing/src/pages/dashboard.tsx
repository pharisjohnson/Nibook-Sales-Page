import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Scissors, CalendarCheck,
  Clock, MessageSquare, Plus, ExternalLink, Calendar as CalendarIcon, Copy, Check,
  Smartphone, Star, Zap, BarChart3, Users, AlertTriangle,
  Link2, Share2, QrCode, Eye, MousePointerClick, DollarSign,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/profile";
import { insforge } from "@/lib/insforge";

type BookingStatus = "Confirmed" | "Pending" | "Cancelled";
type Booking = {
  id: string;
  client: string;
  initials: string;
  service: string;
  time: string;
  date: string;
  duration: string;
  amount: string;
  phone: string;
  status: BookingStatus;
};

const statusStyle: Record<BookingStatus, string> = {
  Confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Cancelled: "bg-red-100 text-red-700 border-red-200",
};


export default function DashboardHome() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [showBookingPage, setShowBookingPage] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statModal, setStatModal] = useState<"revenue" | "bookings" | "completion" | "topservice" | null>(null);

  const firstName = profile?.business_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  const bookingSlug = profile?.slug ?? "your-business";
  const bookingPageUrl = `https://nibook.com/book/${bookingSlug}`;

  useEffect(() => {
    if (!user) return;
    setBookingsLoading(true);
    insforge.database
      .from("bookings")
      .select("*, services(name)")
      .eq("owner_id", user.id)
      .order("scheduled_at", { ascending: true })
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const mapped: Booking[] = data.map((b: any) => {
            const dt = b.scheduled_at ? new Date(b.scheduled_at) : null;
            const isToday = dt ? new Date().toDateString() === dt.toDateString() : false;
            const isTomorrow = dt ? new Date(Date.now() + 86400000).toDateString() === dt.toDateString() : false;
            return {
              id: b.id,
              client: b.client_name ?? "Client",
              initials: (b.client_name ?? "C").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
              service: b.services?.name ?? "Service",
              time: dt ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
              date: isToday ? "Today" : isTomorrow ? "Tomorrow" : dt ? dt.toLocaleDateString() : "",
              duration: b.duration_minutes ? `${b.duration_minutes} min` : "",
              amount: b.amount ? `KES ${Number(b.amount).toLocaleString()}` : "",
              phone: b.client_phone ?? "",
              status: (b.status === "confirmed" ? "Confirmed" : b.status === "cancelled" ? "Cancelled" : "Pending") as BookingStatus,
            };
          });
          setBookings(mapped);
        } else {
          setBookings([]);
        }
        setBookingsLoading(false);
      });
  }, [user]);

  const copyUrl = () => {
    navigator.clipboard.writeText(bookingPageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied!", description: "Your booking page link is on the clipboard." });
  };

  const confirmCancel = () => {
    if (!cancelTarget) return;
    setBookings(prev => prev.map(b => b.id === cancelTarget.id ? { ...b, status: "Cancelled" } : b));
    toast({ title: "Booking cancelled", description: `${cancelTarget.client}'s booking has been cancelled.` });
    setCancelTarget(null);
    setViewBooking(null);
  };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  const activeBookings = bookings.filter(b => b.status !== "Cancelled");

  return (
    <>
      <motion.div className="max-w-6xl mx-auto space-y-8" variants={container} initial="hidden" animate="show">

        {/* Header */}
        <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Good morning, {firstName}! ☀️</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              {activeBookings.length > 0
                ? <>Next appointment — <span className="font-medium text-foreground">{activeBookings[0].client} at {activeBookings[0].time}</span></>
                : "No upcoming bookings yet. Share your booking link to get started!"}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2" onClick={() => setShowBookingPage(true)}>
              <ExternalLink className="w-4 h-4" />
              Booking Page
            </Button>
            <Button className="gap-2" onClick={() => navigate("/bookings")}>
              <Plus className="w-4 h-4" />
              New Booking
            </Button>
          </div>
        </motion.div>

        {/* Stat cards — each opens its own specific modal */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setStatModal("revenue")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <div className="p-2 bg-primary/10 rounded-full text-primary group-hover:bg-primary/20 transition-colors"><DollarSign className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-bold leading-none">KES 34,200</h3>
              <p className="text-xs font-medium mt-2 flex items-center gap-1 text-green-600"><ArrowUpRight className="w-3 h-3" />+12% this month</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setStatModal("bookings")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">Bookings This Month</p>
                <div className="p-2 bg-primary/10 rounded-full text-primary group-hover:bg-primary/20 transition-colors"><CalendarIcon className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-bold leading-none">18</h3>
              <p className="text-xs font-medium mt-2 flex items-center gap-1 text-green-600"><ArrowUpRight className="w-3 h-3" />+4 from last month</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setStatModal("completion")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <div className="p-2 bg-primary/10 rounded-full text-primary group-hover:bg-primary/20 transition-colors"><CalendarCheck className="w-4 h-4" /></div>
              </div>
              <h3 className="text-2xl font-bold leading-none">94%</h3>
              <p className="text-xs font-medium mt-2 text-muted-foreground">Industry avg: 88%</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setStatModal("topservice")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">Top Service</p>
                <div className="p-2 bg-primary/10 rounded-full text-primary group-hover:bg-primary/20 transition-colors"><Scissors className="w-4 h-4" /></div>
              </div>
              <h3 className="text-lg font-bold leading-none truncate">Hair Braiding</h3>
              <p className="text-xs font-medium mt-2 text-muted-foreground">8 bookings this month</p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Upcoming bookings table */}
          <motion.div variants={item} className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Upcoming Bookings</h2>
              <Button variant="link" className="px-0 text-primary" onClick={() => navigate("/bookings")}>
                View all →
              </Button>
            </div>

            <Card className="shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3.5 font-medium">Client</th>
                      <th className="px-5 py-3.5 font-medium hidden sm:table-cell">Service</th>
                      <th className="px-5 py-3.5 font-medium">Time</th>
                      <th className="px-5 py-3.5 font-medium">Status</th>
                      <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <AnimatePresence>
                      {bookings.map((booking) => (
                        <motion.tr
                          key={booking.id}
                          layout
                          initial={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-card hover:bg-muted/40 transition-colors"
                        >
                          <td className="px-5 py-4 font-medium">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="w-8 h-8 shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                  {booking.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[80px]">{booking.client}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground hidden sm:table-cell">{booking.service}</td>
                          <td className="px-5 py-4 text-sm">
                            <span className="font-medium">{booking.date}</span>
                            <span className="text-muted-foreground ml-1">{booking.time}</span>
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant="outline" className={`text-xs ${statusStyle[booking.status]}`}>
                              {booking.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2.5"
                                onClick={() => setViewBooking(booking)}
                              >
                                View
                              </Button>
                              {booking.status !== "Cancelled" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs px-2.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setCancelTarget(booking)}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              {bookings.length === 0 && (
                <div className="p-10 text-center text-muted-foreground">
                  <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No upcoming bookings.</p>
                </div>
              )}
            </Card>

            {/* Active count banner */}
            <p className="text-xs text-muted-foreground px-1">
              {activeBookings.length} active booking{activeBookings.length !== 1 ? "s" : ""} this week
              <button className="text-primary ml-2 underline underline-offset-2 hover:no-underline" onClick={() => navigate("/bookings")}>
                Manage all
              </button>
            </p>
          </motion.div>

          {/* Quick actions */}
          <motion.div variants={item} className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Quick Actions</h2>

            <div className="grid gap-3">
              <Card
                className="group hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => navigate("/services")}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">Add Service</h3>
                    <p className="text-xs text-muted-foreground">Create a new offering</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>

              <Card
                className="group hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => navigate("/analytics")}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform shrink-0" style={{ backgroundColor: "rgba(255,107,107,0.1)", color: "#FF6B6B" }}>
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm group-hover:text-[#FF6B6B] transition-colors">View Analytics</h3>
                    <p className="text-xs text-muted-foreground">Check your performance</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>

              <Card
                className="group hover:border-[#4CB963]/50 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => navigate("/settings")}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shrink-0" style={{ backgroundColor: "rgba(76,185,99,0.1)", color: "#4CB963" }}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm group-hover:text-[#4CB963] transition-colors">WhatsApp Setup</h3>
                    <p className="text-xs text-muted-foreground">Connect for notifications</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>

              <Card
                className="group hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => navigate("/team")}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm group-hover:text-purple-600 transition-colors">Invite Team</h3>
                    <p className="text-xs text-muted-foreground">Add staff members</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardContent>
              </Card>
            </div>

            {/* Upgrade banner */}
            <Card className="bg-primary text-primary-foreground shadow-md overflow-hidden relative">
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <CardContent className="p-5 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/80">Pro Plan</span>
                </div>
                <h3 className="font-bold text-base mb-1.5">Unlock branded client app</h3>
                <p className="text-primary-foreground/75 text-xs mb-4">
                  Your own iOS & Android app, custom domain, and unlimited bookings.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full bg-white text-primary hover:bg-white/90 font-semibold"
                  onClick={() => setShowUpgrade(true)}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* ── View booking dialog ── */}
      <Dialog open={!!viewBooking} onOpenChange={open => { if (!open) setViewBooking(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>Full details for this appointment.</DialogDescription>
          </DialogHeader>
          {viewBooking && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-xl">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{viewBooking.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{viewBooking.client}</p>
                  <p className="text-sm text-muted-foreground">{viewBooking.phone}</p>
                </div>
                <Badge variant="outline" className={`ml-auto ${statusStyle[viewBooking.status]}`}>{viewBooking.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Service", value: viewBooking.service },
                  { label: "Duration", value: viewBooking.duration },
                  { label: "Date", value: viewBooking.date },
                  { label: "Time", value: viewBooking.time },
                  { label: "Amount", value: viewBooking.amount },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 bg-muted/40 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className="font-semibold text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            {viewBooking?.status !== "Cancelled" && (
              <Button
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => { setCancelTarget(viewBooking!); setViewBooking(null); }}
              >
                Cancel Booking
              </Button>
            )}
            <Button onClick={() => { setViewBooking(null); navigate("/bookings"); }}>
              Manage in Bookings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel confirmation dialog ── */}
      <Dialog open={!!cancelTarget} onOpenChange={open => { if (!open) setCancelTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Cancel Booking
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel <strong>{cancelTarget?.client}</strong>'s {cancelTarget?.service} appointment on {cancelTarget?.date} at {cancelTarget?.time}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep Booking</Button>
            <Button variant="destructive" onClick={confirmCancel}>Yes, Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Booking page modal ── */}
      <Dialog open={showBookingPage} onOpenChange={setShowBookingPage}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
          {/* Hero banner */}
          <div className="relative bg-gradient-to-br from-primary to-blue-700 px-6 pt-8 pb-14 text-white overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-background rounded-t-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">Booking Page</span>
              </div>
              <h2 className="text-2xl font-bold mb-1">Amina's Beauty Studio</h2>
              <p className="text-white/70 text-sm">Your public booking page is live and accepting appointments</p>
            </div>
          </div>

          <div className="px-6 pb-6 space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 -mt-1">
              {[
                { label: "Page views", value: "142", icon: Eye, color: "text-blue-600 bg-blue-50" },
                { label: "Bookings made", value: "18", icon: MousePointerClick, color: "text-green-600 bg-green-50" },
                { label: "Conv. rate", value: "12.7%", icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="p-3.5 bg-muted/40 border border-border/50 rounded-2xl text-center">
                  <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center mx-auto mb-2`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <p className="font-bold text-xl leading-none">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-tight">{label}</p>
                </div>
              ))}
            </div>

            {/* URL field */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your booking link</p>
              <div className="flex items-center gap-0 border border-border rounded-xl overflow-hidden bg-muted/30">
                <div className="flex items-center gap-2.5 px-3 py-3 flex-1 min-w-0">
                  <ExternalLink className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-mono text-foreground truncate">{bookingPageUrl}</span>
                </div>
                <button
                  onClick={copyUrl}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold shrink-0 border-l border-border transition-all ${
                    copied
                      ? "bg-green-50 text-green-600"
                      : "bg-background hover:bg-muted text-foreground"
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Share options */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Share via</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { window.open(`https://wa.me/?text=Book an appointment with Amina's Beauty Studio: ${bookingPageUrl}`, "_blank"); }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-muted/30 hover:bg-green-50 hover:border-green-200 transition-all group"
                >
                  <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium group-hover:text-green-700">WhatsApp</span>
                </button>
                <button
                  onClick={copyUrl}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-muted/30 hover:bg-primary/5 hover:border-primary/30 transition-all group"
                >
                  <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium group-hover:text-primary">Copy Link</span>
                </button>
                <button
                  onClick={() => toast({ title: "QR Code", description: "QR code download available on Pro." })}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-muted/30 hover:bg-slate-100 hover:border-slate-300 transition-all group"
                >
                  <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium group-hover:text-slate-700">QR Code</span>
                </button>
              </div>
            </div>

            {/* Open page button */}
            <Button
              className="w-full gap-2 h-11 text-sm font-semibold"
              onClick={() => { window.open(bookingPageUrl, "_blank"); setShowBookingPage(false); }}
            >
              <ExternalLink className="w-4 h-4" />
              Open Booking Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Revenue Modal ── */}
      <Dialog open={statModal === "revenue"} onOpenChange={open => { if (!open) setStatModal(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" />Revenue Breakdown</DialogTitle>
            <DialogDescription>Your earnings this month, broken down by service.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "This month", value: "KES 34,200", up: true, delta: "+12%" },
                { label: "Last month", value: "KES 30,530", up: null, delta: "" },
                { label: "This year", value: "KES 341K", up: true, delta: "+28%" },
              ].map(({ label, value, up, delta }) => (
                <div key={label} className="p-3 bg-muted/40 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="font-bold text-sm">{value}</p>
                  {delta && <p className={`text-xs font-medium mt-0.5 ${up ? "text-green-600" : "text-red-500"}`}>{delta}</p>}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">By service</p>
              {[
                { name: "Hair Braiding", amount: 20000, pct: 58 },
                { name: "Locs Retwist", amount: 7000, pct: 20 },
                { name: "Beard Trim", amount: 4800, pct: 14 },
                { name: "Other", amount: 2400, pct: 8 },
              ].map(s => (
                <div key={s.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{s.name}</span>
                    <span className="font-semibold">KES {s.amount.toLocaleString()} <span className="text-muted-foreground font-normal text-xs">{s.pct}%</span></span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatModal(null)}>Close</Button>
            <Button onClick={() => { setStatModal(null); navigate("/analytics"); }}>Full Analytics →</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bookings Modal ── */}
      <Dialog open={statModal === "bookings"} onOpenChange={open => { if (!open) setStatModal(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary" />Bookings This Month</DialogTitle>
            <DialogDescription>Status breakdown and trends for April 2026.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "This month", value: "18", delta: "+4", up: true },
                { label: "Last month", value: "14", delta: "", up: null },
                { label: "This year", value: "112", delta: "+22%", up: true },
              ].map(({ label, value, delta, up }) => (
                <div key={label} className="p-3 bg-muted/40 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="font-bold text-lg">{value}</p>
                  {delta && <p className={`text-xs font-medium mt-0.5 ${up ? "text-green-600" : "text-red-500"}`}>{delta}</p>}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">By status</p>
              {[
                { label: "Confirmed", count: 8, pct: 44, color: "bg-blue-500" },
                { label: "Completed", count: 7, pct: 39, color: "bg-green-500" },
                { label: "Pending", count: 2, pct: 11, color: "bg-yellow-400" },
                { label: "Cancelled", count: 1, pct: 6, color: "bg-red-400" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3 text-sm">
                  <div className={`w-3 h-3 rounded-full ${s.color} shrink-0`} />
                  <span className="flex-1">{s.label}</span>
                  <span className="font-semibold">{s.count}</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatModal(null)}>Close</Button>
            <Button onClick={() => { setStatModal(null); navigate("/bookings"); }}>Manage Bookings →</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Completion Rate Modal ── */}
      <Dialog open={statModal === "completion"} onOpenChange={open => { if (!open) setStatModal(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CalendarCheck className="w-5 h-5 text-primary" />Completion Rate</DialogTitle>
            <DialogDescription>How well your appointments are going — and where to improve.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center py-2">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0066CC" strokeWidth="3"
                    strokeDasharray={`${94} ${100 - 94}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">94%</span>
                  <span className="text-xs text-muted-foreground">completed</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Completed", value: "17", color: "text-green-600 bg-green-50" },
                { label: "No-Shows", value: "1", color: "text-orange-600 bg-orange-50" },
                { label: "Industry avg.", value: "88%", color: "text-blue-600 bg-blue-50" },
                { label: "Your streak", value: "14 days", color: "text-purple-600 bg-purple-50" },
              ].map(({ label, value, color }) => (
                <div key={label} className={`p-3 rounded-xl text-center ${color}`}>
                  <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
                  <p className="font-bold text-lg">{value}</p>
                </div>
              ))}
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              You're performing 6% above the industry average. Keep it up!
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatModal(null)}>Close</Button>
            <Button onClick={() => { setStatModal(null); navigate("/analytics"); }}>Full Analytics →</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Top Service Modal ── */}
      <Dialog open={statModal === "topservice"} onOpenChange={open => { if (!open) setStatModal(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Scissors className="w-5 h-5 text-primary" />Service Performance</DialogTitle>
            <DialogDescription>Your services ranked by bookings and revenue this month.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {[
              { rank: 1, name: "Hair Braiding", bookings: 8, revenue: "KES 20,000", trend: +18, color: "from-pink-500 to-rose-500" },
              { rank: 2, name: "Locs Retwist", bookings: 4, revenue: "KES 14,000", trend: +12, color: "from-violet-500 to-purple-500" },
              { rank: 3, name: "Beard Trim", bookings: 4, revenue: "KES 3,200", trend: -5, color: "from-blue-500 to-cyan-500" },
              { rank: 4, name: "Haircut & Style", bookings: 2, revenue: "KES 2,000", trend: +7, color: "from-emerald-500 to-teal-500" },
            ].map(s => (
              <div key={s.name} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <span className="text-lg font-bold text-muted-foreground w-6 text-center">#{s.rank}</span>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
                  <Scissors className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.bookings} bookings · {s.revenue}</p>
                </div>
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${s.trend >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {s.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(s.trend)}%
                </span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatModal(null)}>Close</Button>
            <Button onClick={() => { setStatModal(null); navigate("/services"); }}>Manage Services →</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
