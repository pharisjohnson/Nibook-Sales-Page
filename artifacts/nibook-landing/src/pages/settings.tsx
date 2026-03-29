import { useState } from "react";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedTheme, setSelectedTheme] = useState("classic");
  const [hasChanges, setHasChanges] = useState(false);
  const [payments, setPayments] = useState(paymentMethods);
  const [mpesaPaybill, setMpesaPaybill] = useState("247247");
  const [mpesaAccount, setMpesaAccount] = useState("AminaBeauty");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [reminderHours, setReminderHours] = useState("24");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [businessName, setBusinessName] = useState("Amina's Beauty Studio");
  const [businessPhone, setBusinessPhone] = useState("+254 700 123 456");
  const [businessEmail, setBusinessEmail] = useState("amina@example.com");

  const togglePayment = (id: string) => {
    setPayments(payments.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
    setHasChanges(true);
  };

  const handleSave = () => {
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
        <Button className="gap-2 shadow-md relative" onClick={handleSave}>
          {hasChanges && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-background" />
          )}
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1">
          <TabsTrigger value="business" className="gap-1.5 text-xs sm:text-sm"><Building2 className="w-3.5 h-3.5" />Business</TabsTrigger>
          <TabsTrigger value="theme" className="gap-1.5 text-xs sm:text-sm"><Palette className="w-3.5 h-3.5" />Theme</TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5 text-xs sm:text-sm"><CreditCard className="w-3.5 h-3.5" />Payments</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5 text-xs sm:text-sm"><MessageSquare className="w-3.5 h-3.5" />WhatsApp</TabsTrigger>
          <TabsTrigger value="connections" className="gap-1.5 text-xs sm:text-sm"><Link2 className="w-3.5 h-3.5" />Connections</TabsTrigger>
          <TabsTrigger value="support" className="gap-1.5 text-xs sm:text-sm"><HelpCircle className="w-3.5 h-3.5" />Support</TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>This info appears on your public booking page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="biz-name">Business name</Label>
                    <Input id="biz-name" value={businessName} onChange={e => { setBusinessName(e.target.value); setHasChanges(true); }} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="biz-phone">Phone number</Label>
                    <Input id="biz-phone" value={businessPhone} onChange={e => { setBusinessPhone(e.target.value); setHasChanges(true); }} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="biz-email">Contact email</Label>
                    <Input id="biz-email" type="email" value={businessEmail} onChange={e => { setBusinessEmail(e.target.value); setHasChanges(true); }} />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Your booking link</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border text-sm">
                    <span className="text-muted-foreground">nibook.com/book/</span>
                    <span className="font-semibold text-primary">aminas-beauty-studio</span>
                    <Button variant="ghost" size="icon" className="ml-auto h-7 w-7">
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
