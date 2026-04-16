import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Calendar, ArrowRight, ArrowLeft, Check, Loader2, Plus, Scissors, Clock, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const categories = [
  "Hair & Beauty", "Barbershop", "Spa & Wellness", "Fitness & Gym",
  "Photography", "Massage Therapy", "Nail Studio", "Tattoo & Piercing",
  "Coaching & Consulting", "Other",
];

type Service = { name: string; price: string; duration: string };

const STEPS = ["Business Info", "Your Services", "You're set!"];

export default function OnboardingPage() {
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [bizName, setBizName] = useState(user?.user_metadata?.business_name ?? "");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");

  const [services, setServices] = useState<Service[]>([{ name: "", price: "", duration: "60" }]);

  function addService() {
    setServices(s => [...s, { name: "", price: "", duration: "60" }]);
  }

  function updateService(i: number, key: keyof Service, val: string) {
    setServices(s => s.map((sv, idx) => idx === i ? { ...sv, [key]: val } : sv));
  }

  function removeService(i: number) {
    setServices(s => s.filter((_, idx) => idx !== i));
  }

  async function handleSkip() {
    await updateProfile({ onboarding_completed: true });
    navigate("/dashboard");
  }

  async function saveStep1() {
    if (!bizName.trim()) {
      toast({ title: "Business name required", variant: "destructive" });
      return;
    }
    setLoading(true);
    const slug = bizName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error } = await updateProfile({
      business_name: bizName.trim(),
      phone: phone.trim() || null,
      location: location.trim() || null,
      category: category || null,
      slug,
    });
    setLoading(false);
    if (error && !error.includes("duplicate")) {
      toast({ title: "Error saving profile", description: error, variant: "destructive" });
      return;
    }
    setStep(1);
  }

  async function saveStep2() {
    setLoading(true);
    const validServices = services.filter(s => s.name.trim());
    for (const svc of validServices) {
      await supabase.from("services").insert({
        owner_id: user!.id,
        name: svc.name.trim(),
        price: parseFloat(svc.price) || 0,
        duration_minutes: parseInt(svc.duration) || 60,
        is_active: true,
      });
    }
    await updateProfile({ onboarding_completed: true });
    setLoading(false);
    setStep(2);
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="bg-primary text-white p-1.5 rounded-lg">
          <Calendar className="w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight">Nibook</span>
      </div>

      <div className="w-full max-w-lg">
        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mb-8">
          {STEPS.map((s, i) => (
            <span key={s} className={i === step ? "text-primary font-semibold" : ""}>{s}</span>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── Step 0: Business Info ─── */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white border border-border rounded-2xl shadow-sm p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Tell us about your business</h2>
                <p className="text-muted-foreground text-sm mt-1">This information will appear on your public booking page.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Business name <span className="text-red-500">*</span></Label>
                  <Input placeholder="e.g. Amina's Beauty Studio" value={bizName} onChange={e => setBizName(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`text-xs text-left px-3 py-2 rounded-lg border transition-all ${
                          category === cat ? "bg-primary text-white border-primary" : "border-border hover:border-primary/40"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Phone number</Label>
                  <Input placeholder="+254 700 000 000" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input placeholder="e.g. Westlands, Nairobi" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSkip}>
                  Skip setup for now
                </Button>
                <Button className="ml-auto gap-2" onClick={saveStep1} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── Step 1: Services ─── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white border border-border rounded-2xl shadow-sm p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Add your services</h2>
                <p className="text-muted-foreground text-sm mt-1">What services do you offer? You can add, edit or remove these later.</p>
              </div>

              <div className="space-y-4">
                {services.map((svc, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-border rounded-xl p-4 space-y-3 relative"
                  >
                    {services.length > 1 && (
                      <button
                        onClick={() => removeService(i)}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-red-500 transition-colors text-lg leading-none"
                      >×</button>
                    )}
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5" />Service name</Label>
                      <Input placeholder="e.g. Hair Braiding" value={svc.name} onChange={e => updateService(i, "name", e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />Price (KES)</Label>
                        <Input placeholder="2500" type="number" value={svc.price} onChange={e => updateService(i, "price", e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Duration (min)</Label>
                        <Input placeholder="60" type="number" value={svc.duration} onChange={e => updateService(i, "duration", e.target.value)} />
                      </div>
                    </div>
                  </motion.div>
                ))}

                <button
                  type="button"
                  onClick={addService}
                  className="w-full flex items-center justify-center gap-2 text-sm text-primary border border-dashed border-primary/40 rounded-xl py-3 hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <Plus className="w-4 h-4" />Add another service
                </button>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setStep(0)}>
                  <ArrowLeft className="w-4 h-4" />Back
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSkip}>
                  Skip for now
                </Button>
                <Button className="ml-auto gap-2" onClick={saveStep2} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Finish Setup <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ─── Step 2: Done ─── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-border rounded-2xl shadow-sm p-10 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-green-100 rounded-full">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">You're all set!</h2>
                <p className="text-muted-foreground">Your Nibook account is ready. Head to your dashboard to start accepting bookings.</p>
              </div>
              <div className="space-y-3 pt-2">
                <Button className="w-full gap-2" onClick={() => navigate("/dashboard")}>
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate("/services")}>
                  Manage Services
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
