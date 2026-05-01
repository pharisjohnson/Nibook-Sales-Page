import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Clock, Star, Phone, MessageSquare, ChevronRight,
  Calendar, Scissors, Check, ArrowLeft, Share2, Heart,
} from "lucide-react";

const business = {
  name: "Amina's Beauty Studio",
  slug: "aminas-beauty-studio",
  category: "Hair & Beauty",
  location: "Westlands, Nairobi",
  rating: 4.8,
  reviewCount: 127,
  phone: "+254 700 123 456",
  about: "Premier hair braiding and beauty studio in Nairobi. Serving clients for over 8 years with professional, caring service. Specialising in African hair braiding, locs, and natural hair care.",
  hours: "Mon–Sat: 8:00 AM – 7:00 PM",
  coverGradient: "from-pink-500 via-rose-500 to-orange-400",
  cover_url: "",   // populated from profile.cover_url
  logo_url: "",    // populated from profile.logo_url
};

const services = [
  { id: 1, name: "Hair Braiding", price: 2500, duration: 120, description: "Box braids, cornrows, and knotless styles", popular: true, color: "from-pink-500 to-rose-500" },
  { id: 2, name: "Beard Trim & Shape", price: 800, duration: 30, description: "Professional beard grooming and lining", popular: false, color: "from-blue-500 to-cyan-500" },
  { id: 3, name: "Locs Retwist", price: 3500, duration: 180, description: "Starter locs and retwisting for existing locs", popular: true, color: "from-violet-500 to-purple-500" },
  { id: 4, name: "Haircut & Style", price: 1000, duration: 45, description: "Cut, wash and blow-dry styling", popular: false, color: "from-emerald-500 to-teal-500" },
  { id: 5, name: "Deep Conditioning", price: 1500, duration: 60, description: "Protein and moisture treatment for hair health", popular: false, color: "from-amber-500 to-orange-500" },
];

const reviews = [
  { id: 1, name: "Grace M.", initials: "GM", rating: 5, date: "2 days ago", text: "Absolutely love my braids! Amina is so skilled and patient. Will definitely be back." },
  { id: 2, name: "James O.", initials: "JO", rating: 5, date: "1 week ago", text: "Best beard trim I've gotten in Nairobi. Clean, precise, and the price is very fair." },
  { id: 3, name: "Fatuma A.", initials: "FA", rating: 4, date: "2 weeks ago", text: "Great service, very professional. My locs look amazing. Booking online was super easy." },
];

const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function BookingStorePage() {
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);
  const [step, setStep] = useState<"pick-time" | "details" | "confirm">("pick-time");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [liked, setLiked] = useState(false);

  // Local state for demo: simulate user-uploaded cover/logo
  const [coverUrl, setCoverUrl] = useState(business.cover_url);
  const [logoUrl, setLogoUrl] = useState(business.logo_url);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCoverUrl(URL.createObjectURL(file));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLogoUrl(URL.createObjectURL(file));
  };

  const openBooking = (service: typeof services[0]) => {
    setSelectedService(service);
    setStep("pick-time");
    setSelectedTime("");
    setClientName("");
    setClientPhone("");
  };

  const handleConfirm = () => {
    if (!clientName.trim() || !clientPhone.trim()) return;
    setStep("confirm");
  };

  const handleDone = () => {
    toast({
      title: "Booking confirmed!",
      description: `Your ${selectedService?.name} appointment has been booked. Check WhatsApp for confirmation.`,
    });
    setSelectedService(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
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

      {/* ── HERO ── */}
      <div className="relative">
        {/* Cover */}
        <div className="relative h-64 overflow-hidden">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Business cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${business.coverGradient}`} />
          )}
          {/* Dark overlay for contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/40" />

          {/* Cover upload button (demo — replace with actual upload in production) */}
          <button
            onClick={() => coverInputRef.current?.click()}
            className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {coverUrl ? "Change cover" : "Add cover"}
          </button>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
        </div>

        {/* Business profile row — overlaps the cover */}
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-end gap-4 -mt-12 mb-4 relative z-10">
            {/* Logo */}
            <div className="relative shrink-0">
              <div
                className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl overflow-hidden cursor-pointer"
                onClick={() => logoInputRef.current?.click()}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Business logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {getInitials(business.name)}
                    </span>
                  </div>
                )}
              </div>
              {/* Logo upload indicator */}
              <button
                onClick={() => logoInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                title="Change logo"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>

            {/* Name + quick stats */}
            <div className="pb-1 flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground leading-tight truncate">{business.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20 py-0">
                  {business.category}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-foreground">{business.rating}</span>
                  <span>({business.reviewCount})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details card */}
          <div className="bg-white border border-border rounded-2xl p-4 mb-5 shadow-sm">
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{business.about}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />{business.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />{business.hours}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" />{business.phone}
              </span>
            </div>
          </div>

          {/* Services */}
          <div className="mb-8">
            <h2 className="text-base font-bold mb-3">Services</h2>
            <div className="space-y-2.5">
              {services.map((service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3.5 bg-white border border-border rounded-2xl hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center shrink-0`}>
                    <Scissors className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm leading-tight">{service.name}</p>
                      {service.popular && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full font-medium">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{service.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="font-bold text-foreground">KES {service.price.toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />{service.duration} min
                      </span>
                    </div>
                  </div>
                  <Button size="sm" className="shrink-0 h-8 px-3 text-xs gap-1" onClick={() => openBooking(service)}>
                    Book <ChevronRight className="w-3 h-3" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Reviews</h2>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-sm">{business.rating}</span>
                <span className="text-xs text-muted-foreground ml-0.5">· {business.reviewCount} reviews</span>
              </div>
            </div>
            <div className="space-y-2.5">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 bg-white border border-border rounded-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {review.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
                    </div>
                    <div className="flex shrink-0">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Booking dialog */}
      <Dialog open={!!selectedService} onOpenChange={open => { if (!open) setSelectedService(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === "confirm" ? "Booking Confirmed!" : `Book: ${selectedService?.name}`}
            </DialogTitle>
            <DialogDescription>
              {step === "pick-time" && "Choose a time that works for you."}
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
                <p className="text-sm text-muted-foreground">{selectedTime} · {business.name}</p>
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
              <div className="p-3 bg-muted/40 rounded-xl flex items-center gap-3">
                <Calendar className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Today — {new Date().toLocaleDateString("en-KE", { weekday: "long", month: "long", day: "numeric" })}</p>
                  <p className="text-xs text-muted-foreground">{selectedService?.duration} min · KES {selectedService?.price.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Available times</p>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                        selectedTime === time
                          ? "bg-primary text-white border-primary"
                          : "bg-white border-border hover:border-primary/50"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full" disabled={!selectedTime} onClick={() => setStep("details")}>
                Continue
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-xl text-sm">
                <span className="font-medium">{selectedService?.name}</span> · {selectedTime}
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
                <Button className="flex-1" disabled={!clientName.trim() || !clientPhone.trim()} onClick={handleConfirm}>
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
