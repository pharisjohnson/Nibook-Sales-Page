import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  ArrowRight, ArrowLeft, Check, Loader2, Plus, Scissors, Clock, DollarSign,
  Copy, ExternalLink, Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/profile";
import { apiFetch } from "@/lib/api";
import {
  getSignupBusinessName,
  clearPendingBusinessName,
  slugFromBusinessName,
} from "@/lib/signup-business";
import { normalizeEastAfricaPhone } from "@/lib/phone";
import {
  DEFAULT_WEEKLY_SCHEDULE,
  saveWeeklySchedule,
  saveDefaultBookingRules,
  type DaySchedule,
} from "@/lib/availability";
import { publicBookingPath, ROUTES } from "@/lib/routes";
import { OnboardingAvailabilityStep } from "@/components/onboarding/OnboardingAvailabilityStep";
import { useToast } from "@/hooks/use-toast";
import { track } from "@/lib/analytics";

const DEFAULT_CATEGORIES = [
  "Hair & Beauty", "Barbershop", "Spa & Wellness", "Fitness & Gym",
  "Photography", "Massage Therapy", "Nail Studio", "Tattoo & Piercing",
  "Coaching & Consulting", "Other",
];

type Service = { name: string; price: string; duration: string };

const STEPS = ["Business", "Services", "Availability", "Launch"];

export default function OnboardingPage() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [bizName, setBizName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [extraCategories, setExtraCategories] = useState<string[]>([]);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  const [services, setServices] = useState<Service[]>([{ name: "", price: "", duration: "60" }]);
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    () => DEFAULT_WEEKLY_SCHEDULE.map(d => ({ ...d })),
  );

  useEffect(() => {
    track.onboardingStarted();
  }, []);

  useEffect(() => {
    const nameFromSignup =
      profile?.business_name?.trim() || getSignupBusinessName(user);
    if (nameFromSignup && !bizName) setBizName(nameFromSignup);
    if (profile?.phone && !phone) setPhone(profile.phone);
    if (profile?.location && !location) setLocation(profile.location);
    if (profile?.category && !category) setCategory(profile.category);
    if (profile?.slug) setSavedSlug(profile.slug);
  }, [profile, user, bizName, phone, location, category]);

  useEffect(() => {
    apiFetch<{ data: string[] }>("/categories").then(({ data }) => {
      if (data?.data?.length) setExtraCategories(data.data);
    });
  }, []);

  const allCategories = useMemo(
    () => [
      ...DEFAULT_CATEGORIES.filter(c => c !== "Other"),
      ...extraCategories.filter(c => !DEFAULT_CATEGORIES.includes(c)),
      "Other",
    ],
    [extraCategories],
  );

  const bookingPath = savedSlug ? publicBookingPath(savedSlug) : null;
  const bookingUrl = bookingPath
    ? `${window.location.origin}${import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}${bookingPath}`.replace(/([^:]\/)\/+/g, "$1")
    : null;

  function addService() {
    setServices(s => [...s, { name: "", price: "", duration: "60" }]);
  }

  function updateService(i: number, key: keyof Service, val: string) {
    setServices(s => s.map((sv, idx) => (idx === i ? { ...sv, [key]: val } : sv)));
  }

  function removeService(i: number) {
    setServices(s => s.filter((_, idx) => idx !== i));
  }

  async function finishOnboarding(navigateTo: string) {
    await updateProfile({ onboarding_completed: true });
    track.onboardingCompleted();
    clearPendingBusinessName();
    navigate(navigateTo);
  }

  async function handleSkip() {
    setLoading(true);
    await finishOnboarding(ROUTES.dashboard.home);
    setLoading(false);
  }

  async function saveStep1() {
    if (!bizName.trim()) {
      toast({ title: "Business name required", variant: "destructive" });
      return;
    }

    const phoneResult = normalizeEastAfricaPhone(phone);
    if (!phoneResult.valid) {
      setPhoneError(phoneResult.error);
      toast({ title: "Invalid phone number", description: phoneResult.error ?? undefined, variant: "destructive" });
      return;
    }
    setPhoneError(null);

    const finalCategory = category === "Other"
      ? customCategory.trim() || "Other"
      : category || null;

    if (category === "Other" && customCategory.trim()) {
      apiFetch("/categories", {
        method: "POST",
        body: JSON.stringify({ name: customCategory.trim() }),
      }).catch(() => undefined);
    }

    const slug = slugFromBusinessName(bizName);
    if (!slug) {
      toast({
        title: "Invalid business name",
        description: "Use letters or numbers in your business name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await updateProfile({
      business_name: bizName.trim(),
      phone: phoneResult.e164 ?? (phone.trim() || null),
      location: location.trim() || null,
      category: finalCategory,
      slug,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error saving profile", description: error, variant: "destructive" });
      return;
    }
    setSavedSlug(slug);
    clearPendingBusinessName();
    setStep(1);
  }

  async function saveStep2() {
    const validServices = services.filter(s => s.name.trim());
    const isTrial = profile?.plan === "trial" || !profile?.plan;
    const maxServices = isTrial ? 3 : Infinity;
    if (validServices.length > maxServices) {
      toast({
        title: "Service limit reached",
        description: `Trial plans can add up to ${maxServices} services. Upgrade for unlimited.`,
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    for (const svc of validServices) {
      await apiFetch("/services", {
        method: "POST",
        body: JSON.stringify({
          owner_id: user!.id,
          name: svc.name.trim(),
          price: parseFloat(svc.price) || 0,
          duration_minutes: parseInt(svc.duration, 10) || 60,
          is_active: true,
        }),
      });
    }
    setLoading(false);
    setStep(2);
  }

  async function saveStep3() {
    if (!user) return;
    const activeDays = schedule.filter(d => d.active);
    if (activeDays.length === 0) {
      toast({ title: "Select at least one working day", variant: "destructive" });
      return;
    }

    setLoading(true);
    const [scheduleRes, rulesRes] = await Promise.all([
      saveWeeklySchedule(user.id, schedule),
      saveDefaultBookingRules(user.id),
    ]);
    setLoading(false);

    if (scheduleRes.error || rulesRes.error) {
      toast({
        title: "Error saving availability",
        description: scheduleRes.error ?? rulesRes.error ?? undefined,
        variant: "destructive",
      });
      return;
    }
    setStep(3);
  }

  async function copyBookingLink() {
    if (!bookingUrl) return;
    try {
      await navigator.clipboard.writeText(bookingUrl);
      toast({ title: "Link copied", description: "Share it with clients on WhatsApp or Instagram." });
    } catch {
      toast({ title: bookingUrl, description: "Copy this link manually." });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex flex-col items-center px-4 py-8 sm:py-12">
      <div className="flex items-center mb-6 sm:mb-8">
        <img src="/nibook-wordmark.png" alt="Nibook" className="h-14 sm:h-16 w-auto" />
      </div>

      <div className="w-full max-w-lg">
        <div className="flex items-center gap-1.5 mb-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground mb-6 sm:mb-8 gap-1">
          {STEPS.map((s, i) => (
            <span key={s} className={i === step ? "text-primary font-semibold" : "truncate"}>{s}</span>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white border border-border rounded-2xl shadow-sm p-6 sm:p-8 space-y-6"
            >
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Tell us about your business</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Shown on your public booking page. Takes under a minute.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="biz-name">Business name <span className="text-red-500">*</span></Label>
                  <Input
                    id="biz-name"
                    autoFocus
                    placeholder="e.g. Amina's Beauty Studio"
                    value={bizName}
                    onChange={e => setBizName(e.target.value)}
                  />
                  {bizName.trim() && (
                    <p className="text-xs text-muted-foreground">
                      Booking link: <span className="font-mono text-primary">{publicBookingPath(slugFromBusinessName(bizName) || "…")}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {allCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => { setCategory(cat); if (cat !== "Other") setCustomCategory(""); }}
                        className={`text-xs text-left px-3 py-2 rounded-lg border transition-all ${
                          category === cat ? "bg-primary text-white border-primary" : "border-border hover:border-primary/40"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  {category === "Other" && (
                    <Input
                      placeholder="Your industry (e.g. Teacher, Veterinary)"
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    inputMode="tel"
                    placeholder="+254 700 000 000"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setPhoneError(null); }}
                    onBlur={() => {
                      const r = normalizeEastAfricaPhone(phone);
                      if (r.valid && r.display) setPhone(r.display);
                      if (!r.valid && phone.trim()) setPhoneError(r.error);
                    }}
                    aria-invalid={!!phoneError}
                  />
                  {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
                  <p className="text-xs text-muted-foreground">Kenya (+254), Uganda (+256), or Tanzania (+255)</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g. Westlands, Nairobi"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSkip} disabled={loading}>
                  Skip for now
                </Button>
                <Button className="ml-auto gap-2" onClick={saveStep1} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white border border-border rounded-2xl shadow-sm p-6 sm:p-8 space-y-6"
            >
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Add your services</h2>
                <p className="text-muted-foreground text-sm mt-1">Price in KES. You can edit these anytime.</p>
              </div>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {services.map((svc, i) => (
                  <div key={i} className="border border-border rounded-xl p-4 space-y-3 relative">
                    {services.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeService(i)}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-red-500 text-lg leading-none"
                        aria-label="Remove service"
                      >×</button>
                    )}
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5" />Service name</Label>
                      <Input placeholder="e.g. Hair Braiding" value={svc.name} onChange={e => updateService(i, "name", e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />Price (KES)</Label>
                        <Input placeholder="2500" type="number" min={0} value={svc.price} onChange={e => updateService(i, "price", e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Minutes</Label>
                        <Input placeholder="60" type="number" min={15} step={15} value={svc.duration} onChange={e => updateService(i, "duration", e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const isTrial = profile?.plan === "trial" || !profile?.plan;
                    const maxServices = isTrial ? 3 : Infinity;
                    if (services.length >= maxServices) {
                      toast({ title: "Trial limit", description: `Trial plans are limited to ${maxServices} services. Upgrade for unlimited.`, variant: "destructive" });
                      return;
                    }
                    addService();
                  }}
                  className="w-full flex items-center justify-center gap-2 text-sm text-primary border border-dashed border-primary/40 rounded-xl py-3 hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <Plus className="w-4 h-4" />Add another service
                  {(!profile?.plan || profile.plan === "trial") && services.length >= 2 && (
                    <span className="text-xs text-muted-foreground">({3 - services.length} remaining on trial)</span>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setStep(0)}>
                  <ArrowLeft className="w-4 h-4" />Back
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setStep(2)} disabled={loading}>
                  Skip services
                </Button>
                <Button className="ml-auto gap-2" onClick={saveStep2} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white border border-border rounded-2xl shadow-sm p-6 sm:p-8 space-y-6"
            >
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Set your working hours</h2>
                <p className="text-muted-foreground text-sm mt-1">When can clients book you? Toggle days off as needed.</p>
              </div>

              <OnboardingAvailabilityStep schedule={schedule} onChange={setSchedule} />

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4" />Back
                </Button>
                <Button className="ml-auto gap-2" onClick={saveStep3} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-border rounded-2xl shadow-sm p-6 sm:p-10 text-center space-y-6"
            >
              <div className="flex justify-center">
                <div className="p-4 bg-green-100 rounded-full">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">You&apos;re ready to take bookings</h2>
                <p className="text-muted-foreground text-sm">
                  Share your link — clients book in under 60 seconds, no account needed.
                </p>
              </div>

              {bookingPath && (
                <div className="text-left rounded-xl border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="w-4 h-4 text-primary" />
                    Your booking page
                  </div>
                  <p className="font-mono text-sm break-all text-primary">{bookingPath}</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" className="gap-2 flex-1" onClick={copyBookingLink}>
                      <Copy className="w-4 h-4" />Copy link
                    </Button>
                    <Button variant="outline" className="gap-2 flex-1" asChild>
                      <a href={bookingPath} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />Preview
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <Button
                  className="w-full gap-2"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    await finishOnboarding(ROUTES.dashboard.home);
                    setLoading(false);
                  }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    await finishOnboarding(ROUTES.dashboard.services);
                    setLoading(false);
                  }}
                >
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
