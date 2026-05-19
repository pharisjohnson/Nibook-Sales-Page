import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import {
  MapPin, Clock, Phone, MessageSquare, ChevronRight,
  Calendar, Scissors, Check, ArrowLeft, Share2, Heart, Loader2,
} from "lucide-react";

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
  price: number;
  duration_minutes: number;
  is_active: boolean;
};

const TIME_SLOTS = ["09:00","10:00","11:00","13:00","14:00","15:00","16:00"];
function to12h(t: string) {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function BookingStorePage() {
  const { toast } = useToast();
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [step, setStep] = useState<"pick-time" | "details" | "confirm">("pick-time");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTime, setSelectedTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      apiFetch<{ data: Business }>(`/profile/by-slug/${slug}`),
      apiFetch<{ data: Service[] }>(`/services?owner_id=__lookup__`),
    ]).then(async ([bizRes]) => {
      const biz = bizRes.data?.data ?? null;
      setBusiness(biz);
      if (biz) {
        const svcRes = await apiFetch<{ data: Service[] }>(`/services?owner_id=${biz.id}`);
        setServices((svcRes.data?.data ?? []).filter(s => s.is_active));
      }
      setPageLoading(false);
    });
  }, [slug]);

  const openBooking = (svc: Service) => {
    setSelectedService(svc);
    setStep("pick-time");
    setSelectedTime("");
    setClientName("");
    setClientPhone("");
  };

  const handleConfirm = async () => {
    if (!clientName.trim() || !clientPhone.trim() || !business || !selectedService) return;
    setSubmitting(true);
    const isoScheduled = new Date(`${selectedDate}T${selectedTime}`).toISOString();
    const { error } = await apiFetch("/bookings", {
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
    if (error) {
      toast({ title: "Booking failed", description: error, variant: "destructive" });
      return;
    }
    setStep("confirm");
  };

  const handleDone = () => {
    toast({
      title: "Booking confirmed!",
      description: `Your ${selectedService?.name} appointment is booked. We'll be in touch via WhatsApp.`,
    });
    setSelectedService(null);
  };

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
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Powered by</span>
          <span className="font-bold text-sm text-primary">Nibook</span>
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

      {/* Booking dialog */}
      <Dialog open={!!selectedService} onOpenChange={open => { if (!open) setSelectedService(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{step === "confirm" ? "Booking Confirmed!" : `Book: ${selectedService?.name}`}</DialogTitle>
            <DialogDescription>
              {step === "pick-time" && "Choose a date and time."}
              {step === "details" && "Enter your details to complete the booking."}
              {step === "confirm" && "We'll send a WhatsApp confirmation shortly."}
            </DialogDescription>
          </DialogHeader>

          {step === "confirm" ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold">{selectedService?.name}</p>
                <p className="text-sm text-muted-foreground">{to12h(selectedTime)} · {business.business_name}</p>
                <p className="text-sm font-medium text-primary">KES {selectedService?.price.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                <MessageSquare className="w-4 h-4 inline mr-1.5" />
                Confirmation will be sent to {clientPhone}
              </div>
              <Button className="w-full" onClick={handleDone}>Done</Button>
            </div>
          ) : step === "pick-time" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setSelectedDate(e.target.value)}
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Available times</p>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                        selectedTime === t ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary/50"
                      }`}
                    >
                      {to12h(t)}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full" disabled={!selectedTime} onClick={() => setStep("details")}>Continue</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-xl text-sm">
                <span className="font-medium">{selectedService?.name}</span> · {to12h(selectedTime)}
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Your name</Label>
                  <Input placeholder="e.g. Grace Mwangi" value={clientName} onChange={e => setClientName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>WhatsApp number</Label>
                  <Input placeholder="+254 7xx xxx xxx" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("pick-time")}>Back</Button>
                <Button
                  className="flex-1"
                  disabled={!clientName.trim() || !clientPhone.trim() || submitting}
                  onClick={handleConfirm}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Confirm Booking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
