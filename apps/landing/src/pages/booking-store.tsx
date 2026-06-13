import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";
import { apiFetch } from "@/lib/api";
import { publicBookingPath } from "@/lib/routes";
import {
  MapPin, Clock, Phone, MessageSquare, ChevronRight,
  Calendar, Scissors, Check, ArrowLeft, Share2, Heart, Loader2,
  Smartphone, CalendarOff,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Business = {
  id: string;
  slug: string;
  business_name: string;
  category: string | null;
  location: string | null;
  phone: string | null;
  bio: string | null;
  cover_url: string | null;
  logo_url: string | null;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
};

type DaySchedule = {
  day_name: string;
  is_active: boolean;
  start_time: string;
  end_time: string;
};

type AvailabilityRules = {
  buffer_minutes: number | null;
  min_notice_hours: number | null;
  max_advance_days: number | null;
};

type Booking = {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function parseTime12h(t: string): number {
  const parts = t.trim().split(" ");
  const [hStr, mStr] = parts[0].split(":");
  const period = parts[1]?.toUpperCase() ?? "AM";
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? "0", 10);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function minutesToHHMM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function to12h(t: string) {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function computeSlots(
  schedule: DaySchedule[],
  rules: AvailabilityRules | null,
  bookedTimes: string[],
  blackoutDates: string[],
  selectedDate: string,
  serviceDuration: number,
): { slots: string[]; reason: string | null } {
  const date = new Date(selectedDate + "T00:00:00");
  const dayName = DAY_NAMES[date.getDay()];

  // Check blackout
  if (blackoutDates.includes(selectedDate)) {
    return { slots: [], reason: "This date is unavailable (time off / holiday)." };
  }

  // Check max advance days
  const maxDays = rules?.max_advance_days ?? 30;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diffDays > maxDays) {
    return { slots: [], reason: `Bookings only open up to ${maxDays} days in advance.` };
  }
  if (diffDays < 0) {
    return { slots: [], reason: "Cannot book a date in the past." };
  }

  // Find day schedule
  const day = schedule.find(s => s.day_name === dayName);
  if (!day?.is_active) {
    return { slots: [], reason: `Not available on ${dayName}s.` };
  }

  const startMins = parseTime12h(day.start_time);
  const endMins = parseTime12h(day.end_time);
  const bufferMins = rules?.buffer_minutes ?? 15;
  const minNoticeMins = (rules?.min_notice_hours ?? 1) * 60;
  const step = serviceDuration + bufferMins;

  const now = new Date();
  const isToday = selectedDate === now.toISOString().split("T")[0];
  const currentMins = isToday ? now.getHours() * 60 + now.getMinutes() + minNoticeMins : 0;

  const slots: string[] = [];
  for (let cursor = startMins; cursor + serviceDuration <= endMins; cursor += step) {
    if (cursor < currentMins) continue;
    const slotStr = minutesToHHMM(cursor);
    if (!bookedTimes.includes(slotStr)) {
      slots.push(slotStr);
    }
  }

  return {
    slots,
    reason: slots.length === 0 ? "No available slots for this date — all slots are booked." : null,
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function BookingStorePage() {
  const { toast } = useToast();
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [rules, setRules] = useState<AvailabilityRules | null>(null);
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useSeo({
    title: business
      ? `Book ${business.business_name}${business.category ? ` · ${business.category}` : ""}${business.location ? ` in ${business.location}` : ""}`
      : "Book an Appointment",
    description: business?.bio
      ? business.bio.slice(0, 155)
      : business
      ? `Book an appointment with ${business.business_name} on Nibook. Easy online booking, no app download needed.`
      : "Book appointments with the best service businesses in Kenya.",
    image: business?.logo_url ?? business?.cover_url ?? undefined,
    url: business ? publicBookingPath(business.slug) : undefined,
    type: "profile",
  });

  // Booking dialog state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [step, setStep] = useState<"pick-time" | "details" | "payment" | "confirm">("pick-time");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTime, setSelectedTime] = useState("");

  // Slots
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsReason, setSlotsReason] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Client info
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Load business + services + availability ─────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    (async () => {
      const bizRes = await apiFetch<{ data: Business }>(`/profile/by-slug/${slug}`);
      const biz = bizRes.data?.data ?? null;
      setBusiness(biz);
      if (biz) {
        const [svcRes, availRes] = await Promise.all([
          apiFetch<{ data: Service[] }>(`/services?owner_id=${biz.id}`),
          apiFetch<{ schedule: DaySchedule[]; blackouts: { date: string }[]; rules: AvailabilityRules | null }>(`/availability/${biz.id}`),
        ]);
        setServices((svcRes.data?.data ?? []).filter(s => s.is_active));
        setSchedule(availRes.data?.schedule ?? []);
        setBlackoutDates((availRes.data?.blackouts ?? []).map(b => b.date));
        setRules(availRes.data?.rules ?? null);
      }
      setPageLoading(false);
    })();
  }, [slug]);

  // ── Recompute slots when date or service changes ────────────────────────────
  const recomputeSlots = useCallback(async (date: string, svc: Service | null) => {
    if (!business || !svc) return;
    setLoadingSlots(true);
    setSelectedTime("");

    if (schedule.length === 0) {
      setAvailableSlots([]);
      setSlotsReason("This business hasn't configured their availability yet. Contact them to book.");
      setLoadingSlots(false);
      return;
    }

    // Fetch existing bookings for this date
    const d = new Date(date + "T00:00:00");
    const next = new Date(d); next.setDate(d.getDate() + 1);
    const { data: bookingsData } = await apiFetch<{ data: Booking[] }>(
      `/bookings?owner_id=${business.id}&from=${d.toISOString()}&to=${next.toISOString()}&limit=200`,
    );
    const bookedTimes = (bookingsData?.data ?? [])
      .filter(b => b.status !== "cancelled")
      .map(b => {
        const dt = new Date(b.scheduled_at);
        return minutesToHHMM(dt.getHours() * 60 + dt.getMinutes());
      });

    const { slots, reason } = computeSlots(schedule, rules, bookedTimes, blackoutDates, date, svc.duration_minutes);
    setAvailableSlots(slots);
    setSlotsReason(reason);
    setLoadingSlots(false);
  }, [business, schedule, rules, blackoutDates]);

  useEffect(() => {
    if (selectedService) recomputeSlots(selectedDate, selectedService);
  }, [selectedDate, selectedService, recomputeSlots]);

  // ── Open booking dialog ─────────────────────────────────────────────────────
  const openBooking = (svc: Service) => {
    setSelectedService(svc);
    setStep("pick-time");
    setSelectedDate(new Date().toISOString().split("T")[0]);
    setSelectedTime("");
    setClientName("");
    setClientPhone("");
    setBookingId(null);
  };

  // ── Step: details → create booking ─────────────────────────────────────────
  const handleDetails = async () => {
    if (!clientName.trim() || !clientPhone.trim() || !business || !selectedService) return;
    setSubmitting(true);
    const isoScheduled = new Date(`${selectedDate}T${selectedTime}`).toISOString();
    const { data, error } = await apiFetch<{ data: { id: string } }>("/bookings", {
      method: "POST",
      body: JSON.stringify({
        owner_id: business.id,
        service_id: selectedService.id,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        scheduled_at: isoScheduled,
        duration_minutes: selectedService.duration_minutes,
        amount: selectedService.price,
        payment_status: "unpaid",
      }),
    });
    setSubmitting(false);
    if (error || !data?.data?.id) {
      toast({ title: "Booking failed", description: error ?? "Try again", variant: "destructive" });
      return;
    }
    setBookingId(data.data.id);
    setStep("payment");
  };

  // ── Step: payment → confirm (placeholder — Jenga integration coming soon) ───
  const handlePay = () => {
    setStep("confirm");
  };

  const handleDone = () => {
    toast({ title: "Booking confirmed!", description: `Your ${selectedService?.name} is booked. We'll be in touch shortly.` });
    setSelectedService(null);
  };

  // ── Min date / max date for the date picker ─────────────────────────────────
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const maxDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (rules?.max_advance_days ?? 30));
    return d.toISOString().split("T")[0];
  })();

  // ─────────────────────────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Business not found.</p>
        <Link href="/directory"><Button variant="outline">Browse directory</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
        <Link href="/directory">
          <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />Back
          </button>
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Powered by</span>
          <img src="/nibook-icon.png" alt="Nibook" className="h-9 w-9 rounded-md object-cover" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied!" }); }}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <Share2 className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => { setLiked(!liked); toast({ title: liked ? "Removed from favourites" : "Saved to favourites!" }); }}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <Heart className={`w-4 h-4 transition-colors ${liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative">
        <div className="relative h-64 overflow-hidden">
          {business.cover_url ? (
            <img src={business.cover_url} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/40" />
        </div>

        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-end gap-4 -mt-12 mb-4 relative z-10">
            <div className="shrink-0">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl overflow-hidden">
                {business.logo_url ? (
                  <img src={business.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">{getInitials(business.business_name)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground leading-tight truncate">{business.business_name}</h1>
              {business.category && (
                <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20 py-0 mt-1">
                  {business.category}
                </Badge>
              )}
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-4 mb-5 shadow-sm">
            {business.bio && <p className="text-sm text-muted-foreground leading-relaxed mb-3">{business.bio}</p>}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
              {business.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />{business.location}
                </span>
              )}
              {business.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary shrink-0" />{business.phone}
                </span>
              )}
            </div>
          </div>

          {/* Services */}
          <div className="mb-12">
            <h2 className="text-base font-bold mb-3">Services</h2>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">No services listed yet.</p>
            ) : (
              <div className="space-y-2.5">
                {services.map((svc, i) => (
                  <motion.div
                    key={svc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3.5 bg-white border border-border rounded-2xl hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shrink-0">
                      <Scissors className="w-[18px] h-[18px] text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-tight">{svc.name}</p>
                      {svc.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-snug">{svc.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="font-bold text-foreground">KES {svc.price.toLocaleString()}</span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />{svc.duration_minutes} min
                        </span>
                      </div>
                    </div>
                    <Button size="sm" className="shrink-0 h-8 px-3 text-xs gap-1" onClick={() => openBooking(svc)}>
                      Book <ChevronRight className="w-3 h-3" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Booking dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={!!selectedService} onOpenChange={open => { if (!open) setSelectedService(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === "confirm" ? "Booking Confirmed!" : `Book: ${selectedService?.name}`}
            </DialogTitle>
            <DialogDescription>
              {step === "pick-time" && "Choose a date and available time slot."}
              {step === "details" && "Enter your contact details to continue."}
              {step === "payment" && "Pay via M-Pesa to confirm your appointment."}
              {step === "confirm" && "Payment received — you're all set!"}
            </DialogDescription>
          </DialogHeader>

          {/* ── Confirm ── */}
          {step === "confirm" && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold">{selectedService?.name}</p>
                <p className="text-sm text-muted-foreground">{to12h(selectedTime)} · {selectedDate} · {business.business_name}</p>
                <p className="text-sm font-bold text-green-600">KES {selectedService?.price.toLocaleString()} paid</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 shrink-0" />
                Confirmation will be sent to {clientPhone}
              </div>
              <Button className="w-full" onClick={handleDone}>Done</Button>
            </div>
          )}

          {/* ── Pick time ── */}
          {step === "pick-time" && (
            <div className="space-y-4">
              {/* Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />Date
                </Label>
                <Input
                  type="date"
                  value={selectedDate}
                  min={today}
                  max={maxDate}
                  onChange={e => setSelectedDate(e.target.value)}
                />
              </div>

              {/* Time slots */}
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />Available times
                  {loadingSlots && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ml-1" />}
                </p>

                {!loadingSlots && slotsReason && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <CalendarOff className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    {slotsReason}
                  </div>
                )}

                {!loadingSlots && !slotsReason && availableSlots.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">Loading availability…</p>
                )}

                {!loadingSlots && availableSlots.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                          selectedTime === t
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-white border-border hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      >
                        {to12h(t)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button className="w-full" disabled={!selectedTime || loadingSlots} onClick={() => setStep("details")}>
                Continue
              </Button>
            </div>
          )}

          {/* ── Details ── */}
          {step === "details" && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-xl text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <span><span className="font-medium">{selectedService?.name}</span> · {to12h(selectedTime)} · {selectedDate}</span>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Your name</Label>
                  <Input placeholder="e.g. Grace Mwangi" value={clientName} onChange={e => setClientName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>WhatsApp / M-Pesa number</Label>
                  <Input placeholder="+254 7xx xxx xxx" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("pick-time")}>Back</Button>
                <Button
                  className="flex-1"
                  disabled={!clientName.trim() || !clientPhone.trim() || submitting}
                  onClick={handleDetails}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {submitting ? "Booking…" : "Next"}
                </Button>
              </div>
            </div>
          )}

          {/* ── Payment (placeholder) ── */}
          {step === "payment" && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/40 rounded-xl space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{selectedService?.name}</span>
                  <span className="font-bold">KES {selectedService?.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{to12h(selectedTime)} · {selectedDate}</span>
                  <span>{business.business_name}</span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-3">
                <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Pay at venue</p>
                  <p className="text-amber-700 text-xs mt-0.5">Online payment coming soon. The business will collect payment at your appointment.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("details")}>Back</Button>
                <Button className="flex-1" onClick={handlePay}>Confirm Booking</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
