import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Palette, MessageSquare, Link2, CreditCard, HelpCircle, Save,
  Check, Phone, Building2, Smartphone, Wallet, ExternalLink,
  Code2, FileText, Copy, Eye, EyeOff, Camera, ImagePlus, Trash2,
  Share2, QrCode, Instagram, Facebook, Globe, Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/profile";
import { uploadFile } from "@/lib/api";
import { Loader2 } from "lucide-react";

const themes = [
  { id: "classic", name: "Classic", primary: "#0066CC", bg: "#FFFFFF" },
  { id: "midnight", name: "Midnight", primary: "#1E293B", bg: "#0F172A" },
  { id: "ocean", name: "Ocean", primary: "#0EA5E9", bg: "#F0F9FF" },
  { id: "forest", name: "Forest", primary: "#16A34A", bg: "#F0FDF4" },
  { id: "rose", name: "Rose", primary: "#E11D48", bg: "#FFF1F2" },
  { id: "amber", name: "Amber", primary: "#D97706", bg: "#FFFBEB" },
];

const paymentMethods = [
  { id: "mpesa", name: "M-Pesa", icon: Smartphone, description: "Accept payments via Safaricom M-Pesa", enabled: true },
  { id: "bank", name: "Bank Transfer", icon: Building2, description: "Accept local bank transfers", enabled: true },
  { id: "inperson", name: "In Person / Cash", icon: Wallet, description: "Record cash and POS payments", enabled: true },
  { id: "paypal", name: "PayPal", icon: CreditCard, description: "Accept international payments", enabled: false },
];

const BASE_URL = "https://nibook.noonstudio.africa";

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [selectedTheme, setSelectedTheme] = useState("classic");
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState(paymentMethods);
  const [mpesaPaybill, setMpesaPaybill] = useState("");
  const [mpesaAccount, setMpesaAccount] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [reminderHours, setReminderHours] = useState("24");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessLocation, setBusinessLocation] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [policyText, setPolicyText] = useState("Cancellations made less than 24 hours before your appointment are non-refundable. No-shows will be charged the full service fee. To reschedule, please contact us at least 4 hours in advance.");
  const [showPolicy, setShowPolicy] = useState(true);
  const [widgetTheme, setWidgetTheme] = useState<"light" | "dark">("light");
  const [embedType, setEmbedType] = useState<"iframe" | "button">("iframe");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name ?? "");
      setBusinessPhone(profile.phone ?? "");
      setBusinessLocation(profile.location ?? "");
      setCoverUrl(profile.cover_url ?? "");
      setLogoUrl(profile.logo_url ?? "");
      setMpesaPaybill(profile.mpesa_paybill ?? "");
      setMpesaAccount(profile.mpesa_account ?? "");
      setWhatsappEnabled(profile.whatsapp_enabled ?? false);
      setWhatsappPhone(profile.whatsapp_phone ?? "");
      setReminderHours(String(profile.reminder_hours ?? "24"));
      if (profile.cancellation_policy) setPolicyText(profile.cancellation_policy);
      if (profile.booking_widget_theme) setSelectedTheme(profile.booking_widget_theme);
    }
    if (user) {
      setBusinessEmail(user.email ?? "");
    }
  }, [profile, user]);

  const togglePayment = (id: string) => {
    setPayments(payments.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
    setHasChanges(true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const { url, error } = await uploadFile(file, "profiles");
    setUploadingCover(false);
    if (error || !url) { toast({ title: "Upload failed", description: error ?? "Try again", variant: "destructive" }); return; }
    setCoverUrl(url);
    setHasChanges(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const { url, error } = await uploadFile(file, "profiles");
    setUploadingLogo(false);
    if (error || !url) { toast({ title: "Upload failed", description: error ?? "Try again", variant: "destructive" }); return; }
    setLogoUrl(url);
    setHasChanges(true);
  };

  const getInitials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "B";

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast({ title: "Copied to clipboard" });
  }

  const handleSave = async () => {
    setSaving(true);
    const slug = businessName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error } = await updateProfile({
      business_name: businessName.trim() || null,
      phone: businessPhone.trim() || null,
      location: businessLocation.trim() || null,
      slug: slug || null,
      mpesa_paybill: mpesaPaybill.trim() || null,
      mpesa_account: mpesaAccount.trim() || null,
      whatsapp_enabled: whatsappEnabled,
      whatsapp_phone: whatsappPhone.trim() || null,
      reminder_hours: parseInt(reminderHours) || 24,
      cancellation_policy: policyText.trim() || null,
      booking_widget_theme: selectedTheme || null,
    });
    setSaving(false);
    if (error && !error.includes("duplicate")) {
      toast({ title: "Error saving", description: error, variant: "destructive" });
      return;
    }
    setHasChanges(false);
    toast({ title: "Settings saved", description: "Your changes have been saved successfully." });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 py-4 -mt-4 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your workspace preferences.</p>
        </div>
        <Button className="gap-2 shadow-md relative" onClick={handleSave} disabled={saving}>
          {hasChanges && !saving && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-background" />
          )}
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1">
          <TabsTrigger value="business" className="gap-1.5 text-xs sm:text-sm"><Building2 className="w-3.5 h-3.5" />Business</TabsTrigger>
          <TabsTrigger value="theme" className="gap-1.5 text-xs sm:text-sm"><Palette className="w-3.5 h-3.5" />Theme</TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5 text-xs sm:text-sm"><CreditCard className="w-3.5 h-3.5" />Payments</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5 text-xs sm:text-sm"><MessageSquare className="w-3.5 h-3.5" />WhatsApp</TabsTrigger>
          <TabsTrigger value="policy" className="gap-1.5 text-xs sm:text-sm"><FileText className="w-3.5 h-3.5" />Policy</TabsTrigger>
          <TabsTrigger value="widget" className="gap-1.5 text-xs sm:text-sm"><Code2 className="w-3.5 h-3.5" />Widget</TabsTrigger>
          <TabsTrigger value="connections" className="gap-1.5 text-xs sm:text-sm"><Link2 className="w-3.5 h-3.5" />Connections</TabsTrigger>
          <TabsTrigger value="support" className="gap-1.5 text-xs sm:text-sm"><HelpCircle className="w-3.5 h-3.5" />Support</TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Branding: Cover + Logo */}
            <Card className="shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Set your cover photo and logo — these appear at the top of your booking page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                {/* Cover preview */}
                <div>
                  <Label className="mb-2 block">Cover photo</Label>
                  <div className="relative h-40 rounded-xl overflow-hidden border border-border bg-muted group">
                    {coverUrl ? (
                      <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 flex items-center justify-center">
                        <p className="text-white/70 text-sm font-medium">No cover photo set</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1.5 shadow"
                        disabled={uploadingCover}
                        onClick={() => coverInputRef.current?.click()}
                      >
                        {uploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                        {uploadingCover ? "Uploading…" : coverUrl ? "Change" : "Upload"}
                      </Button>
                      {coverUrl && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1.5 shadow"
                          onClick={() => { setCoverUrl(""); setHasChanges(true); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                  <p className="text-xs text-muted-foreground mt-1.5">Recommended: 1200×400px, JPG or PNG. Max 5 MB.</p>
                </div>

                {/* Logo preview */}
                <div>
                  <Label className="mb-2 block">Logo</Label>
                  <div className="flex items-center gap-4">
                    <div
                      className="relative w-20 h-20 rounded-2xl border-2 border-border overflow-hidden cursor-pointer group shrink-0"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                          <span className="text-white text-xl font-bold">{getInitials(businessName)}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="gap-1.5" disabled={uploadingLogo} onClick={() => logoInputRef.current?.click()}>
                        {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                        {uploadingLogo ? "Uploading…" : logoUrl ? "Change logo" : "Upload logo"}
                      </Button>
                      {logoUrl && (
                        <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive block"
                          onClick={() => { setLogoUrl(""); setHasChanges(true); }}
                        >
                          <Trash2 className="w-3.5 h-3.5 inline mr-1" />Remove
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">Square image, 400×400px recommended.</p>
                    </div>
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
              </CardContent>
            </Card>

            {/* Business info */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>This info appears on your public booking page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="biz-name">Business name</Label>
                    <Input id="biz-name" placeholder="Your business name" value={businessName} onChange={e => { setBusinessName(e.target.value); setHasChanges(true); }} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="biz-phone">Phone number</Label>
                    <Input id="biz-phone" placeholder="+254 700 000 000" value={businessPhone} onChange={e => { setBusinessPhone(e.target.value); setHasChanges(true); }} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="biz-email">Account email</Label>
                    <Input id="biz-email" type="email" value={businessEmail} readOnly className="bg-muted/50 cursor-not-allowed" />
                    <p className="text-xs text-muted-foreground">Email is linked to your account and cannot be changed here.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="biz-location">Location</Label>
                    <Input id="biz-location" placeholder="e.g. Westlands, Nairobi" value={businessLocation} onChange={e => { setBusinessLocation(e.target.value); setHasChanges(true); }} />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Your booking link</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border text-sm">
                    <span className="text-muted-foreground">nibook.noonstudio.africa/</span>
                    <span className="font-semibold text-primary">{profile?.slug || "your-business"}</span>
                    <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => {
                      if (profile?.slug) window.open(`/${profile.slug}`, "_blank");
                    }}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="theme">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Page Theme</CardTitle>
                <CardDescription>Choose how your public booking page looks to clients.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {themes.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => { setSelectedTheme(theme.id); setHasChanges(true); }}
                      className={`relative rounded-xl border-2 overflow-hidden transition-all hover:scale-[1.02] focus:outline-none ${selectedTheme === theme.id ? "border-primary shadow-lg shadow-primary/20" : "border-border hover:border-muted-foreground/30"}`}
                    >
                      <div className="h-16" style={{ backgroundColor: theme.bg }}>
                        <div className="h-4 w-full" style={{ backgroundColor: theme.primary }} />
                        <div className="p-2 flex gap-1">
                          <div className="h-2 w-8 rounded" style={{ backgroundColor: theme.primary, opacity: 0.3 }} />
                          <div className="h-2 w-12 rounded bg-gray-200" />
                        </div>
                      </div>
                      <div className="p-2 text-center text-xs font-medium border-t bg-card">
                        {theme.name}
                      </div>
                      {selectedTheme === theme.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="payments">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {payments.map(method => {
              const Icon = method.icon;
              return (
                <Card key={method.id} className={`shadow-sm transition-opacity ${!method.enabled ? "opacity-60" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 bg-muted rounded-lg shrink-0">
                        <Icon className="w-5 h-5 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">{method.name}</p>
                          <Switch checked={method.enabled} onCheckedChange={() => togglePayment(method.id)} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{method.description}</p>
                        {method.id === "mpesa" && method.enabled && (
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Paybill number</Label>
                              <Input value={mpesaPaybill} onChange={e => { setMpesaPaybill(e.target.value); setHasChanges(true); }} className="h-8 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Account name</Label>
                              <Input value={mpesaAccount} onChange={e => { setMpesaAccount(e.target.value); setHasChanges(true); }} className="h-8 text-sm" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>

          {/* Payout account */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payout account</CardTitle>
                <CardDescription className="text-sm">
                  Where Nibook sends client payments after your sessions. Funds arrive within 24 hours via Jenga.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">M-Pesa number (preferred)</Label>
                  <Input
                    placeholder="+254 7xx xxx xxx"
                    value={profile?.payout_mobile ?? ""}
                    onChange={e => { updateProfile({ payout_mobile: e.target.value }); setHasChanges(true); }}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="relative flex items-center gap-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or bank account</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Bank name</Label>
                    <Input
                      placeholder="e.g. Equity Bank"
                      value={profile?.payout_bank_name ?? ""}
                      onChange={e => { updateProfile({ payout_bank_name: e.target.value }); setHasChanges(true); }}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Account number</Label>
                    <Input
                      placeholder="e.g. 0011547896523"
                      value={profile?.payout_bank_account ?? ""}
                      onChange={e => { updateProfile({ payout_bank_account: e.target.value }); setHasChanges(true); }}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">Account holder name</Label>
                    <Input
                      placeholder="As it appears on the account"
                      value={profile?.payout_account_name ?? ""}
                      onChange={e => { updateProfile({ payout_account_name: e.target.value }); setHasChanges(true); }}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Nibook retains a 3% facilitation fee per booking. The remainder is transferred to your payout account.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="whatsapp">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>WhatsApp Notifications</CardTitle>
                <CardDescription>Send booking confirmations and reminders to clients via WhatsApp.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
                  <div>
                    <p className="font-medium">Enable WhatsApp notifications</p>
                    <p className="text-sm text-muted-foreground">Requires Pro plan</p>
                  </div>
                  <Switch
                    checked={whatsappEnabled}
                    onCheckedChange={v => { setWhatsappEnabled(v); setHasChanges(true); }}
                  />
                </div>

                <div className={`space-y-4 transition-opacity ${!whatsappEnabled ? "opacity-40 pointer-events-none" : ""}`}>
                  <div className="space-y-2">
                    <Label htmlFor="wa-phone">WhatsApp Business phone number</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                      <Input
                        id="wa-phone"
                        placeholder="+254 700 000 000"
                        value={whatsappPhone}
                        onChange={e => { setWhatsappPhone(e.target.value); setHasChanges(true); }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Send reminder before appointment</Label>
                    <Select value={reminderHours} onValueChange={v => { setReminderHours(v); setHasChanges(true); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour before</SelectItem>
                        <SelectItem value="2">2 hours before</SelectItem>
                        <SelectItem value="24">24 hours before</SelectItem>
                        <SelectItem value="48">48 hours before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
                    <p className="font-medium mb-1">✅ What clients will receive:</p>
                    <p className="text-green-700">Booking confirmation + reminder {reminderHours}h before their appointment with your business name, service, date, and time.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── Cancellation Policy ── */}
        <TabsContent value="policy">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Cancellation Policy</CardTitle>
                <CardDescription>Write your cancellation terms. Clients will see this on your booking page before confirming.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    {showPolicy ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    <div>
                      <p className="font-medium text-sm">Show policy on booking page</p>
                      <p className="text-xs text-muted-foreground">Clients must acknowledge it before booking</p>
                    </div>
                  </div>
                  <Switch checked={showPolicy} onCheckedChange={v => { setShowPolicy(v); setHasChanges(true); }} />
                </div>

                <div className="space-y-2">
                  <Label>Policy text</Label>
                  <textarea
                    className="w-full min-h-[140px] rounded-lg border border-input bg-muted/20 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    value={policyText}
                    onChange={e => { setPolicyText(e.target.value); setHasChanges(true); }}
                  />
                  <p className="text-xs text-muted-foreground">{policyText.length} characters</p>
                </div>

                {showPolicy && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Preview — how clients see it</Label>
                    <div className="p-4 border border-amber-200 bg-amber-50 rounded-xl">
                      <div className="flex items-start gap-2 mb-2">
                        <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold text-amber-900">Cancellation Policy</p>
                      </div>
                      <p className="text-sm text-amber-800 leading-relaxed">{policyText || <span className="italic opacity-50">No policy text yet.</span>}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <input type="checkbox" id="policy-preview-check" className="w-4 h-4 accent-amber-600" readOnly />
                        <label htmlFor="policy-preview-check" className="text-xs text-amber-700">I have read and agree to the cancellation policy</label>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── Embeddable Widget ── */}
        <TabsContent value="widget">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {!profile?.slug ? (
              <Card className="shadow-sm">
                <CardContent className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                    <Code2 className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="font-semibold">Set up your business profile first</p>
                  <p className="text-sm text-muted-foreground">Add your business name in the Business tab to generate your embed code.</p>
                </CardContent>
              </Card>
            ) : (() => {
              const bookingUrl = `${BASE_URL}/${profile.slug}`;
              const selectedThemeData = themes.find(t => t.id === selectedTheme) ?? themes[0];
              const iframeSnippet = `<!-- Nibook Booking Widget -->
<iframe
  src="${bookingUrl}"
  width="100%"
  height="720"
  frameborder="0"
  style="border-radius:12px; border:1px solid #e5e7eb; display:block;"
  title="Book an appointment with ${profile.business_name ?? "us"}"
  loading="lazy"
></iframe>`;
              const buttonSnippet = `<!-- Nibook Booking Button -->
<a
  href="${bookingUrl}"
  target="_blank"
  rel="noopener"
  style="display:inline-block; background:${selectedThemeData.primary}; color:#fff; padding:13px 28px; border-radius:8px; text-decoration:none; font-family:sans-serif; font-weight:600; font-size:15px;"
>
  Book an Appointment
</a>`;
              const snippet = embedType === "iframe" ? iframeSnippet : buttonSnippet;

              return (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Booking Widget</CardTitle>
                    <CardDescription>Embed your live booking page on any website — it works immediately, no extra setup needed.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">

                    {/* Booking URL bar */}
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl border text-sm">
                      <Globe className="w-4 h-4 text-primary shrink-0" />
                      <span className="flex-1 font-mono text-xs truncate text-muted-foreground">{bookingUrl}</span>
                      <button
                        onClick={() => copyText(bookingUrl, "url")}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors shrink-0"
                      >
                        {copiedKey === "url" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey === "url" ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={() => window.open(bookingUrl, "_blank")}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Preview
                      </button>
                    </div>

                    {/* Embed type selector */}
                    <div className="flex items-center justify-between">
                      <Label>Embed type</Label>
                      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                        {(["iframe", "button"] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setEmbedType(t)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${embedType === t ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                          >
                            {t === "iframe" ? "Embedded page" : "Button / link"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {embedType === "button" && (
                      <div className="flex items-center justify-between">
                        <Label>Button colour (from your theme)</Label>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full border border-border" style={{ background: selectedThemeData.primary }} />
                          <span className="text-xs font-mono text-muted-foreground">{selectedThemeData.primary}</span>
                        </div>
                      </div>
                    )}

                    {/* Snippet */}
                    <div className="space-y-2">
                      <Label>
                        {embedType === "iframe" ? "Paste inside your page's <body>" : "Paste anywhere on your page"}
                      </Label>
                      <div className="relative">
                        <pre className="bg-slate-900 text-green-400 rounded-xl p-4 pr-20 text-xs overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap break-all">
                          {snippet}
                        </pre>
                        <button
                          onClick={() => copyText(snippet, "snippet")}
                          className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          {copiedKey === "snippet" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedKey === "snippet" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-muted/40 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Business slug</p>
                        <p className="font-medium text-sm font-mono">{profile.slug}</p>
                      </div>
                      <div className="p-3 bg-muted/40 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Embed type</p>
                        <p className="font-medium text-sm capitalize">{embedType === "iframe" ? "Full page" : "Button"}</p>
                      </div>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-700 mb-1">Status</p>
                        <p className="font-semibold text-sm text-green-800 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                          Live
                        </p>
                      </div>
                    </div>

                    <Separator />
                    <div className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Code2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>The embedded page is fully responsive and updates automatically whenever you change your services or availability — no re-pasting required.</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </motion.div>
        </TabsContent>

        <TabsContent value="connections">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Share your booking link */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Share2 className="w-4 h-4" />Share your booking page</CardTitle>
                <CardDescription>Send your booking link to clients directly — no account needed for them.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.slug ? (() => {
                  const bookingUrl = `${BASE_URL}/${profile.slug}`;
                  const waText = encodeURIComponent(`Book an appointment with ${profile.business_name ?? "us"}: ${bookingUrl}`);
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(bookingUrl)}&bgcolor=ffffff&color=0f172a&margin=12`;

                  return (
                    <>
                      {/* URL display */}
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl border">
                        <span className="flex-1 text-sm font-mono truncate">{bookingUrl}</span>
                        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => copyText(bookingUrl, "share-url")}>
                          {copiedKey === "share-url" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedKey === "share-url" ? "Copied!" : "Copy link"}
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => window.open(bookingUrl, "_blank")}>
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open
                        </Button>
                      </div>

                      {/* Share buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <a
                          href={`https://wa.me/?text=${waText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group"
                        >
                          <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs font-medium">WhatsApp</span>
                        </a>
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(bookingUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
                        >
                          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Facebook className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs font-medium">Facebook</span>
                        </a>
                        <a
                          href={`https://www.instagram.com/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:border-pink-400 hover:bg-pink-50 transition-all group"
                          title="Add your booking link to your Instagram bio"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Instagram className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs font-medium">Instagram bio</span>
                        </a>
                        <button
                          onClick={() => setShowQr(v => !v)}
                          className="flex flex-col items-center gap-2 p-4 border rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all group"
                        >
                          <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center group-hover:scale-110 transition-transform">
                            <QrCode className="w-4 h-4 text-background" />
                          </div>
                          <span className="text-xs font-medium">QR Code</span>
                        </button>
                      </div>

                      {/* QR Code panel */}
                      {showQr && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="border rounded-xl p-5 flex flex-col sm:flex-row items-center gap-5 bg-muted/30"
                        >
                          <img
                            src={qrUrl}
                            alt="Booking page QR code"
                            className="w-36 h-36 rounded-lg border shadow-sm"
                          />
                          <div className="space-y-2 text-center sm:text-left">
                            <p className="font-semibold text-sm">Scan to book</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">Print this QR code and display it at your reception, on flyers, or business cards. Clients scan it to book instantly.</p>
                            <a
                              href={qrUrl}
                              download="nibook-qr.png"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm" className="gap-1.5 mt-1">
                                <Copy className="w-3.5 h-3.5" />
                                Save QR image
                              </Button>
                            </a>
                          </div>
                        </motion.div>
                      )}

                      {/* Instagram tip */}
                      <div className="flex items-start gap-3 p-3.5 bg-pink-50 border border-pink-200 rounded-xl text-sm">
                        <Instagram className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                        <p className="text-pink-800">
                          <strong>Instagram tip:</strong> Go to your profile → Edit profile → Website, and paste your booking link. Your followers can book directly from your bio.
                        </p>
                      </div>
                    </>
                  );
                })() : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Complete your business profile first to get your shareable booking link.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Google Calendar */}
            <Card className="shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden border">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" className="w-full h-full object-contain p-1.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">Google Calendar</p>
                  <p className="text-sm text-muted-foreground">Automatically add new bookings to your Google Calendar</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                    <Clock className="w-3 h-3" />Coming soon
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Webhook / API */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Link2 className="w-4 h-4" />Webhook endpoint</CardTitle>
                <CardDescription>Receive a POST request to your own server whenever a booking is created, cancelled, or updated.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Your webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://yoursite.com/webhooks/nibook"
                      className="font-mono text-xs h-8"
                      onChange={() => setHasChanges(true)}
                    />
                    <Button size="sm" variant="outline" className="shrink-0 h-8 text-xs">Save</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">We'll send a JSON payload with event type and booking details.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Events sent</Label>
                  <div className="flex flex-wrap gap-2">
                    {["booking.created", "booking.cancelled", "booking.rescheduled", "payment.received"].map(e => (
                      <Badge key={e} variant="outline" className="font-mono text-xs">{e}</Badge>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Example payload</p>
                  <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">{`{
  "event": "booking.created",
  "business": "${profile?.slug ?? "your-slug"}",
  "booking": { "id": "...", "client": "...", "service": "...", "at": "..." }
}`}</pre>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="support">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Support Preferences</CardTitle>
                <CardDescription>How would you like to reach us if you need help?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Preferred support channel</Label>
                  <Select defaultValue="email" onValueChange={() => setHasChanges(true)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email support</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp support</SelectItem>
                      <SelectItem value="chat">Live chat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Support contact email</Label>
                  <Input id="support-email" type="email" defaultValue="amina@example.com" onChange={() => setHasChanges(true)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Priority support</p>
                    <p className="text-sm text-muted-foreground">Get responses within 2 hours — Pro feature</p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pro only</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
