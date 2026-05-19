import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Save, Info, Ban, X, CalendarOff, Plus, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

const timeOptions = [
  "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"
];

const initialSchedule = [
  { day: "Monday", active: true, start: "8:00 AM", end: "6:00 PM" },
  { day: "Tuesday", active: true, start: "8:00 AM", end: "6:00 PM" },
  { day: "Wednesday", active: true, start: "9:00 AM", end: "5:00 PM" },
  { day: "Thursday", active: true, start: "8:00 AM", end: "6:00 PM" },
  { day: "Friday", active: true, start: "8:00 AM", end: "7:00 PM" },
  { day: "Saturday", active: true, start: "9:00 AM", end: "4:00 PM" },
  { day: "Sunday", active: false, start: "10:00 AM", end: "2:00 PM" },
];

type BlackoutDate = { id: number; date: string; reason: string };
const initialBlackouts: BlackoutDate[] = [
  { id: 1, date: "2024-12-25", reason: "Christmas Day" },
  { id: 2, date: "2024-01-01", reason: "New Year's Day" },
];

export default function AvailabilityPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [schedule, setSchedule] = useState(initialSchedule);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [blackouts, setBlackouts] = useState<BlackoutDate[]>(initialBlackouts);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    if (!user) return;
    apiFetch<{ schedule: any[]; blackouts: any[] }>(`/availability/${user.id}`).then(({ data }) => {
      if (data?.schedule && data.schedule.length > 0) {
        setSchedule(data.schedule.map((d: any) => ({
          day: d.day_name,
          active: d.is_active,
          start: d.start_time,
          end: d.end_time,
        })));
      }
      if (data?.blackouts) {
        setBlackouts(data.blackouts.map((b: any) => ({ id: b.id, date: b.date, reason: b.reason ?? "" })));
      }
    });
  }, [user]);

  const toggleDay = (index: number) => {
    const s = [...schedule];
    s[index].active = !s[index].active;
    setSchedule(s);
    setHasChanges(true);
  };

  const updateTime = (index: number, field: "start" | "end", value: string) => {
    const s = [...schedule];
    s[index][field] = value;
    setSchedule(s);
    setHasChanges(true);
  };

  const addBlackout = async () => {
    if (!newDate) { setDateError("Please pick a date."); return; }
    if (blackouts.some(b => b.date === newDate)) { setDateError("This date is already blocked."); return; }
    if (!user) return;
    setDateError("");
    const reason = newReason.trim() || "Time off";
    const { data: blackoutRes } = await apiFetch<{ data: any }>(`/availability/${user.id}/blackouts`, {
      method: "POST",
      body: JSON.stringify({ date: newDate, reason }),
    });
    const newId = blackoutRes?.data?.id ?? Date.now();
    setBlackouts([...blackouts, { id: newId, date: newDate, reason }]);
    setNewDate("");
    setNewReason("");
    setHasChanges(true);
    toast({ title: "Date blocked", description: "Clients cannot book on this date." });
  };

  const removeBlackout = async (id: number) => {
    await apiFetch(`/availability/${user?.id}/blackouts/${id}`, { method: "DELETE" });
    setBlackouts(blackouts.filter(b => b.id !== id));
    setHasChanges(true);
  };

  const formatDate = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 py-4 -mt-4 mb-4 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Availability</h1>
          <p className="text-muted-foreground mt-1">Set your working hours, time off, and booking rules.</p>
        </div>
        <Button
          className="gap-2 shadow-md transition-all"
          disabled={!hasChanges}
          onClick={async () => {
            if (!user) return;
            setSaving(true);
            await apiFetch(`/availability/${user.id}/schedule`, {
              method: "PUT",
              body: JSON.stringify({
                schedule: schedule.map((s, i) => ({
                  day_name: s.day, is_active: s.active, start_time: s.start, end_time: s.end, sort_order: i,
                })),
              }),
            });
            setSaving(false);
            setHasChanges(false);
            toast({ title: "Availability saved", description: "Your schedule has been updated." });
          }}
        >
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* ── Weekly schedule ── */}
        <Card className="shadow-sm overflow-hidden">
          <div className="bg-primary/5 p-4 border-b flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground/80">
              <span className="font-semibold text-primary">Info:</span> These settings control how clients can book on your public booking page. Time zone: <span className="font-semibold">Nairobi (EAT)</span>.
            </p>
          </div>
          <CardContent className="p-0">
            <div className="divide-y">
              {schedule.map((day, idx) => (
                <div
                  key={day.day}
                  className={`p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${day.active ? "bg-card" : "bg-muted/30 grayscale-[0.5]"}`}
                >
                  <div className="flex items-center gap-4 min-w-[140px]">
                    <Switch checked={day.active} onCheckedChange={() => toggleDay(idx)} />
                    <span className={`font-semibold ${day.active ? "text-foreground" : "text-muted-foreground"}`}>{day.day}</span>
                  </div>
                  {day.active ? (
                    <div className="flex items-center gap-3 flex-1 md:justify-end">
                      <Select value={day.start} onValueChange={v => updateTime(idx, "start", v)}>
                        <SelectTrigger className="w-[120px] bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>{timeOptions.map(t => <SelectItem key={`s-${t}`} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                      <span className="text-muted-foreground">–</span>
                      <Select value={day.end} onValueChange={v => updateTime(idx, "end", v)}>
                        <SelectTrigger className="w-[120px] bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>{timeOptions.map(t => <SelectItem key={`e-${t}`} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                      <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground ml-4 w-16 justify-end">
                        <Clock className="w-4 h-4" /><span>9h</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 md:text-right text-sm text-muted-foreground italic pl-12 md:pl-0">Unavailable</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Time-off / Blackout dates ── */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarOff className="w-5 h-5 text-accent" />
              <div>
                <CardTitle>Time-off & Blackout Dates</CardTitle>
                <CardDescription>Block specific days without changing your weekly schedule. Clients won't be able to book on these dates.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Add form */}
            <div className="p-4 bg-muted/40 rounded-xl space-y-3">
              <Label className="text-sm font-medium">Add a blocked date</Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="space-y-1 flex-1">
                  <Input
                    type="date"
                    value={newDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => { setNewDate(e.target.value); setDateError(""); }}
                    className="bg-background"
                  />
                  {dateError && (
                    <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{dateError}</p>
                  )}
                </div>
                <Input
                  placeholder="Reason (e.g. Holiday, Vacation)"
                  value={newReason}
                  onChange={e => setNewReason(e.target.value)}
                  className="flex-1 bg-background"
                />
                <Button onClick={addBlackout} className="gap-2 shrink-0">
                  <Plus className="w-4 h-4" />Block Date
                </Button>
              </div>
            </div>

            {/* Blocked dates list */}
            {blackouts.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{blackouts.length} date{blackouts.length !== 1 ? "s" : ""} blocked</p>
                <div className="flex flex-wrap gap-2">
                  {blackouts
                    .slice()
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map(b => (
                      <div
                        key={b.id}
                        className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-red-50 border border-red-200 rounded-lg group"
                      >
                        <Ban className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <div className="text-sm">
                          <span className="font-medium text-red-800">{formatDate(b.date)}</span>
                          {b.reason && <span className="text-red-600 ml-1.5 text-xs">· {b.reason}</span>}
                        </div>
                        <button
                          onClick={() => removeBlackout(b.id)}
                          className="ml-1 w-5 h-5 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CalendarOff className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No blocked dates yet. Add a date above to prevent bookings.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Booking Rules ── */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Booking Rules</CardTitle>
            <CardDescription>Control how and when clients can schedule and cancel appointments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Buffer between appointments</Label>
                <Select defaultValue="15" onValueChange={() => setHasChanges(true)}>
                  <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Give yourself time to clean up between clients.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Minimum booking notice</Label>
                <Select defaultValue="2" onValueChange={() => setHasChanges(true)}>
                  <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No minimum (last minute)</SelectItem>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Earliest a client can book before an appointment.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Maximum advance booking</Label>
                <Select defaultValue="30" onValueChange={() => setHasChanges(true)}>
                  <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days (1 month)</SelectItem>
                    <SelectItem value="60">60 days (2 months)</SelectItem>
                    <SelectItem value="90">90 days (3 months)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">How far in the future clients can book.</p>
              </div>

              {/* ── Cancellation window (NEW) ── */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Cancellation window</Label>
                  <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">New</Badge>
                </div>
                <Select defaultValue="24" onValueChange={() => setHasChanges(true)}>
                  <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Clients can always cancel</SelectItem>
                    <SelectItem value="1">Lock 1 hour before</SelectItem>
                    <SelectItem value="2">Lock 2 hours before</SelectItem>
                    <SelectItem value="4">Lock 4 hours before</SelectItem>
                    <SelectItem value="8">Lock 8 hours before</SelectItem>
                    <SelectItem value="24">Lock 24 hours before</SelectItem>
                    <SelectItem value="48">Lock 48 hours before</SelectItem>
                    <SelectItem value="never">No self-cancellations</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">After this point clients cannot cancel on their own — they must contact you directly.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
