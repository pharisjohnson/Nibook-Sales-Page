import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import {
  Search, MoreHorizontal, Plus, Calendar as CalendarIcon, Filter,
  MessageSquare, Clock, DollarSign, CreditCard, User, CheckCircle2, AlertCircle,
  LayoutList, LayoutGrid, Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const capitalize = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/-(\w)/g, (_: string, c: string) => `-${c.toUpperCase()}`) : s;

type Status = "Confirmed" | "Pending" | "Completed" | "Cancelled" | "No-Show";
type Booking = {
  id: string;
  serviceId?: string;
  client: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  amount: string;
  payment: string;
  status: Status;
  notes: string;
};

const SERVICES = ["Hair Braiding", "Beard Trim", "Locs Retwist", "Haircut", "Massage"];
const PAYMENTS = ["M-Pesa", "Bank Transfer", "In Person", "PayPal"];
const TIMES = ["08:00 AM","09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","12:00 PM","01:00 PM","02:00 PM","02:30 PM","03:00 PM","04:00 PM","05:00 PM"];
const AMOUNTS: Record<string, string> = {
  "Hair Braiding": "2,500", "Beard Trim": "800", "Locs Retwist": "3,500", "Haircut": "1,000", "Massage": "2,000",
};

const statusConfig: Record<Status, string> = {
  Confirmed: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
  Completed: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
  Cancelled: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
  Pending:   "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200",
  "No-Show": "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
};

function StatusBadge({ status }: { status: Status }) {
  return <Badge className={`${statusConfig[status]} shadow-none`}>{status}</Badge>;
}

type ModalType = "details" | "message" | "reschedule" | "cancel" | "add" | "mark" | null;

export default function BookingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [userServices, setUserServices] = useState<{ id: string; name: string; price: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Booking | null>(null);

  useEffect(() => {
    if (!user) return;
    setBookingsLoading(true);
    Promise.all([
      apiFetch<{ data: any[] }>(`/bookings?owner_id=${user.id}&limit=200`),
      apiFetch<{ data: any[] }>(`/services?owner_id=${user.id}`),
    ]).then(([bookingsRes, servicesRes]) => {
      if (bookingsRes.data?.data) {
        setBookings(bookingsRes.data.data.map((b: any) => {
          const dt = b.scheduled_at ? new Date(b.scheduled_at) : null;
          return {
            id: b.id,
            serviceId: b.service_id,
            client: b.client_name,
            phone: b.client_phone ?? "—",
            service: b.services?.name ?? "Service",
            date: dt ? dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
            time: dt ? dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—",
            amount: Number(b.amount ?? 0).toLocaleString(),
            payment: b.payment_status ?? "unpaid",
            status: capitalize(b.status) as Status,
            notes: b.notes ?? "",
          };
        }));
      }
      if (servicesRes.data?.data) setUserServices(servicesRes.data.data);
      setBookingsLoading(false);
    }).catch(() => setBookingsLoading(false));
  }, [user]);

  // Message modal state
  const [message, setMessage] = useState("");

  // Reschedule modal state
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  // Add Booking state
  const [addForm, setAddForm] = useState({ client: "", phone: "", service: "Hair Braiding", date: "", time: "10:00 AM", payment: "M-Pesa", notes: "" });
  const [addError, setAddError] = useState("");

  const openModal = (type: ModalType, booking: Booking | null = null) => {
    setSelected(booking);
    setModal(type);
    if (type === "message" && booking) {
      setMessage(`Hi ${booking.client.split(" ")[0]}, this is a reminder about your ${booking.service} appointment on ${booking.date} at ${booking.time}. Please let us know if you have any questions. 😊`);
    }
    if (type === "reschedule" && booking) {
      setRescheduleDate("");
      setRescheduleTime(booking.time);
    }
    if (type === "add") {
      setAddForm({ client: "", phone: "", service: "Hair Braiding", date: "", time: "10:00 AM", payment: "M-Pesa", notes: "" });
      setAddError("");
    }
  };

  const closeModal = () => { setModal(null); setSelected(null); };

  const markBooking = async (id: string, newStatus: "Completed" | "No-Show") => {
    const booking = bookings.find(b => b.id === id);
    const dbStatus = newStatus === "No-Show" ? "no-show" : newStatus.toLowerCase();
    await apiFetch(`/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status: dbStatus }) });
    setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
    toast({
      title: newStatus === "Completed" ? "Marked as completed" : "Marked as no-show",
      description: `${booking?.client}'s booking has been updated.`,
    });
  };

  const handleCancel = async () => {
    if (!selected) return;
    await apiFetch(`/bookings/${selected.id}`, { method: "PATCH", body: JSON.stringify({ status: "cancelled" }) });
    setBookings(bookings.map(b => b.id === selected.id ? { ...b, status: "Cancelled" } : b));
    toast({ title: "Booking cancelled", description: `${selected.client}'s booking has been cancelled.` });
    closeModal();
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    toast({ title: "Message sent", description: `WhatsApp message sent to ${selected?.client}.` });
    closeModal();
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast({ title: "Missing fields", description: "Please select both a date and time.", variant: "destructive" });
      return;
    }
    const formatted = new Date(rescheduleDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const isoDate = new Date(`${rescheduleDate}T${rescheduleTime}`).toISOString();
    await apiFetch(`/bookings/${selected!.id}`, { method: "PATCH", body: JSON.stringify({ scheduled_at: isoDate, status: "confirmed" }) });
    setBookings(bookings.map(b =>
      b.id === selected?.id ? { ...b, date: formatted, time: rescheduleTime, status: "Confirmed" } : b
    ));
    toast({ title: "Booking rescheduled", description: `${selected?.client} rescheduled to ${formatted} at ${rescheduleTime}.` });
    closeModal();
  };

  const handleAddBooking = async () => {
    if (!addForm.client.trim()) { setAddError("Client name is required."); return; }
    if (!addForm.date) { setAddError("Please select a date."); return; }
    if (!user) return;
    setAddError("");
    const formatted = new Date(addForm.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const svc = userServices.find(s => s.name === addForm.service);
    const isoScheduled = new Date(`${addForm.date}T${addForm.time}`).toISOString();
    const rawAmount = svc?.price ?? Number((AMOUNTS[addForm.service] ?? "0").replace(/,/g, ""));
    const { data: bookingRes, error } = await apiFetch<{ data: any }>("/bookings", {
      method: "POST",
      body: JSON.stringify({
        owner_id: user.id,
        service_id: svc?.id ?? null,
        client_name: addForm.client,
        client_phone: addForm.phone || null,
        scheduled_at: isoScheduled,
        amount: rawAmount,
        payment_status: "unpaid",
        notes: addForm.notes || null,
      }),
    });
    const data = bookingRes?.data;
    if (error || !data) { setAddError("Failed to save booking. Please try again."); return; }
    const newBooking: Booking = {
      id: data.id,
      serviceId: svc?.id,
      client: addForm.client,
      phone: addForm.phone || "—",
      service: addForm.service,
      date: formatted,
      time: addForm.time,
      amount: AMOUNTS[addForm.service] || "0",
      payment: addForm.payment,
      status: "Pending",
      notes: addForm.notes,
    };
    setBookings([newBooking, ...bookings]);
    toast({ title: "Booking added", description: `${addForm.client}'s booking has been created.` });
    closeModal();
  };

  const filtered = bookings.filter(b => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = b.client.toLowerCase().includes(q) || b.service.toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
    if (activeTab === "upcoming") return matchesSearch && (b.status === "Confirmed" || b.status === "Pending");
    if (activeTab === "completed") return matchesSearch && b.status === "Completed";
    if (activeTab === "cancelled") return matchesSearch && b.status === "Cancelled";
    return matchesSearch;
  });

  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const statusGradient: Record<Status, string> = {
    Confirmed:  "from-blue-500 to-indigo-600",
    Pending:    "from-amber-400 to-orange-500",
    Completed:  "from-emerald-500 to-teal-600",
    Cancelled:  "from-red-500 to-rose-600",
    "No-Show":  "from-slate-500 to-gray-700",
  };

  function BookingCard({ booking }: { booking: Booking }) {
    const initials = booking.client.split(" ").map(n => n[0]).join("");
    return (
      <div className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/20 transition-all flex flex-col">
        {/* Top gradient banner with initials */}
        <div className={`h-28 bg-gradient-to-br ${statusGradient[booking.status]} flex items-center justify-center relative`}>
          <span className="text-3xl font-bold text-white/80">{initials}</span>
          <span className="absolute top-2.5 right-2.5">
            <StatusBadge status={booking.status} />
          </span>
        </div>

        {/* Card body */}
        <div className="p-3 flex flex-col gap-1.5 flex-1">
          <div>
            <p className="font-bold text-sm leading-tight">{booking.client}</p>
            <p className="text-xs text-muted-foreground">{booking.phone}</p>
          </div>
          <p className="text-xs font-medium text-primary">{booking.service}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarIcon className="w-3 h-3 shrink-0" />
            <span>{booking.date}</span>
            <Clock className="w-3 h-3 shrink-0 ml-1" />
            <span>{booking.time}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <DollarSign className="w-3 h-3 text-green-600 shrink-0" />
            <span className="font-semibold">KES {booking.amount}</span>
            <span className="text-muted-foreground">· {booking.payment}</span>
          </div>
        </div>

        {/* Card footer */}
        <div className="px-3 pb-3 pt-2 border-t border-border/50 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 flex-1" onClick={() => openModal("details", booking)}>
            Details
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => openModal("message", booking)}>Message Client</DropdownMenuItem>
              {(booking.status === "Pending" || booking.status === "Confirmed") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => markBooking(booking.id, "Completed")}>✅ Mark Completed</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => markBooking(booking.id, "No-Show")}>🚫 No-Show</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => openModal("reschedule", booking)}>Reschedule</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openModal("cancel", booking)}>
                    Cancel Booking
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground mt-1">Manage your appointments and schedule.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-white border border-border rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => setViewMode("table")}
              title="Table view"
              className={`p-2 transition-colors ${viewMode === "table" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              title="Cards view"
              className={`p-2 transition-colors ${viewMode === "cards" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <Button className="gap-2 shadow-md" onClick={() => openModal("add")}>
            <Plus className="w-5 h-5" />
            Add Booking
          </Button>
        </div>
      </div>

      {/* Shared filters bar — always visible */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-3 md:p-4 border-b flex flex-col gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === t.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {t.label}
                <span className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 ${
                  activeTab === t.key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {t.key === "all" ? bookings.length
                    : t.key === "upcoming" ? bookings.filter(b => b.status === "Confirmed" || b.status === "Pending").length
                    : t.key === "completed" ? bookings.filter(b => b.status === "Completed").length
                    : bookings.filter(b => b.status === "Cancelled").length}
                </span>
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search client, service, ID..."
                className="pl-9 bg-muted/30 h-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 bg-muted/30">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop table — table view only */}
        {viewMode === "table" && <div className="hidden md:block overflow-x-auto">
          {bookingsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-20">ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? filtered.map((booking) => (
                <TableRow key={booking.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">{booking.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {booking.client.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{booking.client}</p>
                        <p className="text-xs text-muted-foreground">{booking.phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{booking.service}</TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{booking.date}</p>
                    <p className="text-xs text-muted-foreground">{booking.time}</p>
                  </TableCell>
                  <TableCell className="font-semibold text-sm">KES {booking.amount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{booking.payment}</TableCell>
                  <TableCell><StatusBadge status={booking.status} /></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openModal("details", booking)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openModal("message", booking)}>Message Client</DropdownMenuItem>
                        {(booking.status === "Pending" || booking.status === "Confirmed") && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => markBooking(booking.id, "Completed")}>
                              ✅ Mark as Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => markBooking(booking.id, "No-Show")}>
                              🚫 Mark as No-Show
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openModal("reschedule", booking)}>Reschedule</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => openModal("cancel", booking)}
                            >
                              Cancel Booking
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <CalendarIcon className="h-8 w-8 mb-2 opacity-20" />
                      <p>No bookings found.</p>
                      <Button variant="link" onClick={() => { setSearchTerm(""); setActiveTab("all"); }} className="mt-1 h-auto py-0">
                        Clear filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </div>}

        {/* Mobile card list — table view only */}
        {viewMode === "table" && <div className="md:hidden divide-y">
          {bookingsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length > 0 ? filtered.map((booking, idx) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="p-4 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {booking.client.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{booking.client}</p>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{booking.service}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" />{booking.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.time}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-foreground"><DollarSign className="w-3 h-3 text-accent" />KES {booking.amount}</span>
                      <span>{booking.payment}</span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => openModal("details", booking)}>View Details</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openModal("message", booking)}>Message Client</DropdownMenuItem>
                    {(booking.status === "Pending" || booking.status === "Confirmed") && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => markBooking(booking.id, "Completed")}>
                          ✅ Mark as Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => markBooking(booking.id, "No-Show")}>
                          🚫 Mark as No-Show
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openModal("reschedule", booking)}>Reschedule</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => openModal("cancel", booking)}
                        >
                          Cancel Booking
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          )) : (
            <div className="p-10 text-center text-muted-foreground">
              <CalendarIcon className="h-8 w-8 mb-2 mx-auto opacity-20" />
              <p>No bookings found.</p>
              <Button variant="link" onClick={() => { setSearchTerm(""); setActiveTab("all"); }}>Clear filters</Button>
            </div>
          )}
        </div>}

        {/* Cards grid — cards view only */}
        {viewMode === "cards" && (
          <div className="p-4">
            {bookingsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((booking, idx) => (
                  <motion.div key={booking.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                    <BookingCard booking={booking} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <CalendarIcon className="h-8 w-8 mb-2 mx-auto opacity-20" />
                <p>No bookings found.</p>
                <Button variant="link" onClick={() => { setSearchTerm(""); setActiveTab("all"); }}>Clear filters</Button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 md:p-4 border-t bg-muted/10 text-xs text-muted-foreground flex items-center justify-between">
          <p>Showing {filtered.length} of {bookings.length} bookings</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled>Next</Button>
          </div>
        </div>
      </div>

      {/* ── View Details Modal ── */}
      <Dialog open={modal === "details"} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>Full information for booking {selected?.id}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {selected.client.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selected.client}</p>
                  <p className="text-sm text-muted-foreground">{selected.phone}</p>
                </div>
                <div className="ml-auto"><StatusBadge status={selected.status} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> Date</p>
                  <p className="font-medium">{selected.date}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Time</p>
                  <p className="font-medium">{selected.time}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Service</p>
                  <p className="font-medium">{selected.service}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Amount</p>
                  <p className="font-semibold">KES {selected.amount}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg col-span-2">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Payment</p>
                  <p className="font-medium">{selected.payment}</p>
                </div>
              </div>
              {selected.notes && (
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p>{selected.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 flex-row">
            <Button variant="outline" className="flex-1" onClick={() => { closeModal(); setTimeout(() => openModal("message", selected), 100); }}>
              <MessageSquare className="w-4 h-4 mr-2" />Message
            </Button>
            <Button className="flex-1" onClick={closeModal}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Message Client Modal ── */}
      <Dialog open={modal === "message"} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Message Client</DialogTitle>
            <DialogDescription>Send a WhatsApp message to {selected?.client}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>Sending via <strong>WhatsApp</strong> to {selected?.phone}</span>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                className="min-h-[120px] resize-none"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground text-right">{message.length} characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSendMessage} className="gap-2">
              <MessageSquare className="w-4 h-4" />Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reschedule Modal ── */}
      <Dialog open={modal === "reschedule"} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
            <DialogDescription>
              Moving {selected?.client}'s {selected?.service} from {selected?.date} at {selected?.time}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-date">New date</Label>
              <Input
                id="new-date"
                type="date"
                value={rescheduleDate}
                onChange={e => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>New time</Label>
              <Select value={rescheduleTime} onValueChange={setRescheduleTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleReschedule}>Confirm Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Booking Confirmation ── */}
      <Dialog open={modal === "cancel"} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-semibold mb-1">Are you sure?</p>
                <p>You are about to cancel <strong>{selected?.client}'s</strong> {selected?.service} appointment on <strong>{selected?.date}</strong> at <strong>{selected?.time}</strong>.</p>
                <p className="mt-1">The client will be notified via WhatsApp.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Keep Booking</Button>
            <Button variant="destructive" onClick={handleCancel}>Yes, Cancel Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Booking Modal ── */}
      <Dialog open={modal === "add"} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Booking</DialogTitle>
            <DialogDescription>Manually create an appointment for a client.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-client">Client name <span className="text-destructive">*</span></Label>
                <Input
                  id="add-client"
                  placeholder="e.g. Maria N."
                  value={addForm.client}
                  onChange={e => { setAddForm({ ...addForm, client: e.target.value }); setAddError(""); }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-phone">Phone number</Label>
                <Input
                  id="add-phone"
                  placeholder="+254 700 000 000"
                  value={addForm.phone}
                  onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Service</Label>
              <Select value={addForm.service} onValueChange={v => setAddForm({ ...addForm, service: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICES.map(s => <SelectItem key={s} value={s}>{s} — KES {AMOUNTS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-date">Date <span className="text-destructive">*</span></Label>
                <Input
                  id="add-date"
                  type="date"
                  value={addForm.date}
                  onChange={e => { setAddForm({ ...addForm, date: e.target.value }); setAddError(""); }}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Select value={addForm.time} onValueChange={v => setAddForm({ ...addForm, time: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment method</Label>
              <Select value={addForm.payment} onValueChange={v => setAddForm({ ...addForm, payment: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-notes">Notes (optional)</Label>
              <Textarea
                id="add-notes"
                placeholder="Any special instructions..."
                className="resize-none min-h-[70px]"
                value={addForm.notes}
                onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
              />
            </div>
            {addError && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {addError}
              </p>
            )}
            {addForm.service && addForm.date && addForm.client && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Booking <strong>{addForm.client}</strong> for <strong>{addForm.service}</strong> (KES {AMOUNTS[addForm.service]}) at {addForm.time}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleAddBooking}>Create Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
