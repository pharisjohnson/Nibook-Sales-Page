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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/profile";

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

const connections = [
  { id: "gcal", name: "Google Calendar", description: "Sync bookings automatically", connected: false },
  { id: "slack", name: "Slack", description: "Get booking notifications in Slack", connected: false },
  { id: "zapier", name: "Zapier", description: "Connect with 5,000+ apps", connected: false },
];

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
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [policyText, setPolicyText] = useState("Cancellations made less than 24 hours before your appointment are non-refundable. No-shows will be charged the full service fee. To reschedule, please contact us at least 4 hours in advance.");
  const [showPolicy, setShowPolicy] = useState(true);
  const [widgetTheme, setWidgetTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name ?? "");
      setBusinessPhone(profile.phone ?? "");
      setBusinessLocation(profile.location ?? "");
      setCoverUrl((profile as Record<string, unknown>).cover_url as string ?? "");
      setLogoUrl((profile as Record<string, unknown>).logo_url as string ?? "");
    }
    if (user) {
      setBusinessEmail(user.email ?? "");
    }
  }, [profile, user]);

  const togglePayment = (id: string) => {
    setPayments(payments.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
    setHasChanges(true);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setCoverUrl(URL.createObjectURL(file)); setHasChanges(true); }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLogoUrl(URL.createObjectURL(file)); setHasChanges(true); }
  };

  const getInitials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "B";

  const handleSave = async () => {
    setSaving(true);
    const slug = businessName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error } = await updateProfile({
      business_name: businessName.trim() || null,
      phone: businessPhone.trim() || null,
      location: businessLocation.trim() || null,
      slug: slug || null,
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
                        onClick={() => coverInputRef.current?.click()}
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        {coverUrl ? "Change" : "Upload"}
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
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => logoInputRef.current?.click()}>
                        <ImagePlus className="w-3.5 h-3.5" />
                        {logoUrl ? "Change logo" : "Upload logo"}
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
                    <span className="text-muted-foreground">nibook.com/book/</span>
                    <span className="font-semibold text-primary">{profile?.slug || "your-business"}</span>
                    <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => {
                      if (profile?.slug) window.open(`/book/${profile.slug}`, "_blank");
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
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Booking Widget</CardTitle>
                <CardDescription>Embed your booking page on any website by pasting a script tag into your HTML.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl text-sm text-primary">
                  <Code2 className="w-4 h-4 shrink-0" />
                  <span>Copy the snippet below and paste it anywhere in your website's <strong>&lt;body&gt;</strong> tag.</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Theme</Label>
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      {(["light", "dark"] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => { setWidgetTheme(t); setHasChanges(true); }}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${widgetTheme === t ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Embed snippet</Label>
                  <div className="relative group">
                    <pre className="bg-slate-900 text-green-400 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed font-mono">
{`<!-- Nibook Booking Widget -->
<script
  src="https://nibook.com/widget.js"
  data-business="aminas-beauty-studio"
  data-theme="${widgetTheme}"
  data-primary="#0066CC"
  async
></script>
<div id="nibook-widget"></div>`}
                    </pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`<!-- Nibook Booking Widget -->\n<script\n  src="https://nibook.com/widget.js"\n  data-business="aminas-beauty-studio"\n  data-theme="${widgetTheme}"\n  data-primary="#0066CC"\n  async\n></script>\n<div id="nibook-widget"></div>`);
                        toast({ title: "Copied!", description: "Widget code copied to clipboard." });
                      }}
                      className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Copy className="w-3 h-3" />Copy
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {[
                    { label: "Business slug", value: "aminas-beauty-studio" },
                    { label: "Widget version", value: "v2.1.0" },
                    { label: "Status", value: "Active" },
                  ].map(item => (
                    <div key={item.label} className="p-3 bg-muted/40 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                      <p className="font-medium text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>

                <Separator />
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Code2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>The widget is fully responsive and inherits your booking page theme. Advanced customization (position, z-index, trigger button) is available on Pro.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="connections">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {connections.map(conn => (
              <Card key={conn.id} className="shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 bg-muted rounded-lg shrink-0">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{conn.name}</p>
                    <p className="text-sm text-muted-foreground">{conn.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {conn.connected
                      ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1"><Check className="w-3 h-3" />Connected</Badge>
                      : <Badge variant="outline" className="text-muted-foreground">Not connected</Badge>
                    }
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      {conn.connected ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <p className="text-xs text-muted-foreground text-center pt-2">
              Connections require a Pro plan. <button className="text-primary underline">Upgrade now</button>
            </p>
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
