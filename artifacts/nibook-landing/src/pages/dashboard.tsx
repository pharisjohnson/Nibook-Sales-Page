import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpRight, TrendingUp, Scissors, CalendarCheck, Clock, MessageSquare,
  Plus, ExternalLink, Calendar as CalendarIcon, Copy, Check,
  Smartphone, Star, Zap, BarChart3, Users, AlertTriangle,
  Link2, Share2, QrCode, Eye, MousePointerClick,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

type BookingStatus = "Confirmed" | "Pending" | "Cancelled";
type Booking = {
  id: number;
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

const initialBookings: Booking[] = [
  { id: 1, client: "Maria N.", initials: "MN", service: "Hair Braiding", time: "10:00 AM", date: "Today", duration: "2 hrs", amount: "KES 2,500", phone: "+254 712 345 678", status: "Confirmed" },
  { id: 2, client: "James O.", initials: "JO", service: "Beard Trim", time: "2:30 PM", date: "Today", duration: "30 min", amount: "KES 800", phone: "+254 722 987 654", status: "Confirmed" },
  { id: 3, client: "Grace M.", initials: "GM", service: "Locs Retwist", time: "9:00 AM", date: "Tomorrow", duration: "3 hrs", amount: "KES 3,500", phone: "+254 733 456 789", status: "Pending" },
];

const statusStyle: Record<BookingStatus, string> = {
  Confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Cancelled: "bg-red-100 text-red-700 border-red-200",
};

const analyticsData = [
  { label: "Mon", value: 3 }, { label: "Tue", value: 5 }, { label: "Wed", value: 2 },
  { label: "Thu", value: 7 }, { label: "Fri", value: 6 }, { label: "Sat", value: 9 }, { label: "Sun", value: 4 },
];
const maxBar = Math.max(...analyticsData.map(d => d.value));

export default function DashboardHome() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [showBookingPage, setShowBookingPage] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [copied, setCopied] = useState(false);

  const bookingPageUrl = "https://nibook.com/book/aminas-beauty-studio";

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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Good morning, Amina! ☀️</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              Next appointment in 2 hours — <span className="font-medium text-foreground">Maria N. at 10:00 AM</span>
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

        {/* Stat cards */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: "KES 34,200", note: "+12% this month", icon: TrendingUp, green: true },
            { label: "Bookings This Month", value: "18", note: "+4 from last month", icon: CalendarIcon, green: true },
            { label: "Completion Rate", value: "94%", note: "Very good", icon: CalendarCheck, green: false },
            { label: "Top Service", value: "Hair Braiding", note: "8 bookings", icon: Scissors, green: false },
          ].map(({ label, value, note, icon: Icon, green }) => (
            <Card key={label} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowAnalytics(true)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <div className="p-2 bg-primary/10 rounded-full text-primary"><Icon className="w-4 h-4" /></div>
                </div>
                <h3 className="text-2xl font-bold leading-none truncate">{value}</h3>
                <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${green ? "text-green-600" : "text-muted-foreground"}`}>
                  {green && <ArrowUpRight className="w-3 h-3" />}{note}
                </p>
              </CardContent>
            </Card>
          ))}
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
                onClick={() => setShowAnalytics(true)}
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

      {/* ── Analytics modal ── */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />Weekly Analytics</DialogTitle>
            <DialogDescription>Bookings this week — click a stat card to see full analytics.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Revenue", value: "KES 8,400", delta: "+18%", color: "text-green-600" },
                { label: "Bookings", value: "36", delta: "+4", color: "text-green-600" },
                { label: "Avg. Value", value: "KES 1,900", delta: "+5%", color: "text-green-600" },
              ].map(({ label, value, delta, color }) => (
                <div key={label} className="p-3 bg-muted/40 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="font-bold text-base">{value}</p>
                  <p className={`text-xs font-medium mt-0.5 ${color}`}>{delta} vs last week</p>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Bookings by day</p>
              <div className="flex items-end gap-2 h-28">
                {analyticsData.map(({ label, value }) => (
                  <div key={label} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-xs font-semibold text-muted-foreground">{value}</span>
                    <div
                      className="w-full bg-primary/15 rounded-t-md relative overflow-hidden"
                      style={{ height: `${(value / maxBar) * 80}px` }}
                    >
                      <div className="absolute bottom-0 inset-x-0 bg-primary rounded-t-md" style={{ height: `${(value / maxBar) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl text-sm">
              <span className="text-muted-foreground">Your busiest day</span>
              <span className="font-semibold text-primary">Saturday — 9 bookings</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnalytics(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Upgrade / Pro modal ── */}
      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Nibook Pro
            </DialogTitle>
            <DialogDescription>Everything you need to grow your service business.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Smartphone, label: "Branded mobile app", desc: "iOS & Android" },
                { icon: Star, label: "Custom domain", desc: "yourbrand.com" },
                { icon: CalendarIcon, label: "Unlimited bookings", desc: "No cap ever" },
                { icon: BarChart3, label: "Advanced analytics", desc: "Revenue reports" },
                { icon: Users, label: "Unlimited staff", desc: "Full team access" },
                { icon: MessageSquare, label: "WhatsApp blasts", desc: "Marketing campaigns" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-2.5 p-3 bg-muted/40 rounded-xl">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-primary rounded-xl text-primary-foreground text-center">
              <p className="text-2xl font-bold">KES 2,500<span className="text-base font-normal text-primary-foreground/70">/month</span></p>
              <p className="text-xs text-primary-foreground/70 mt-1">Cancel anytime · 14-day free trial</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setShowUpgrade(false)}>Maybe Later</Button>
            <Button className="flex-1 gap-2" onClick={() => { setShowUpgrade(false); toast({ title: "🎉 Pro trial started!", description: "Your 14-day free trial is now active." }); }}>
              <Zap className="w-4 h-4" />
              Start Free Trial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
