import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Clock, Star, Phone, MessageSquare, ChevronRight,
  Calendar, Scissors, Check, ArrowLeft, Share2, Heart, X,
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

export default function BookingStorePage() {
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);
  const [step, setStep] = useState<"pick-time" | "details" | "confirm">("pick-time");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [liked, setLiked] = useState(false);

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
      title: "Booking confirmed! 🎉",
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

      {/* Cover */}
      <div className={`h-52 bg-gradient-to-br ${business.coverGradient} relative`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Business info */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="-mt-8 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-xl border-4 border-white mb-4">
            <Scissors className="w-9 h-9 text-white" />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{business.name}</h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">{business.category}</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />{business.location}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{business.rating}</span>
                  <span className="text-muted-foreground">({business.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{business.about}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{business.hours}</span>
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{business.phone}</span>
          </div>
        </div>

        {/* Services */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Our Services</h2>
          <div className="space-y-3">
            {services.map((service) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-4 bg-white border border-border rounded-2xl hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center shrink-0`}>
                  <Scissors className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{service.name}</p>
                    {service.popular && <Badge className="text-[10px] px-1.5 py-0 bg-accent/10 text-accent border-0">Popular</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">KES {service.price.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{service.duration} min</span>
                  </div>
                </div>
                <Button size="sm" className="shrink-0 h-8 text-xs gap-1.5" onClick={() => openBooking(service)}>
                  Book <ChevronRight className="w-3 h-3" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Reviews</h2>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold">{business.rating}</span>
              <span className="text-sm text-muted-foreground">· {business.reviewCount} reviews</span>
            </div>
          </div>
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 bg-white border border-border rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {review.initials}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.date}</p>
                  </div>
                  <div className="flex">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{review.text}</p>
              </div>
            ))}
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
