import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Save, Info, AlertCircle } from "lucide-react";

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

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [hasChanges, setHasChanges] = useState(false);

  const toggleDay = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index].active = !newSchedule[index].active;
    setSchedule(newSchedule);
    setHasChanges(true);
  };

  const updateTime = (index: number, field: 'start' | 'end', value: string) => {
    const newSchedule = [...schedule];
    newSchedule[index][field] = value;
    setSchedule(newSchedule);
    setHasChanges(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 py-4 -mt-4 mb-4 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Availability</h1>
          <p className="text-muted-foreground mt-1">Set your regular working hours.</p>
        </div>
        <Button 
          className="gap-2 shadow-md transition-all" 
          disabled={!hasChanges}
          onClick={() => setHasChanges(false)}
        >
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="shadow-sm overflow-hidden">
          <div className="bg-primary/5 p-4 border-b flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground/80">
              <span className="font-semibold text-primary">Info:</span> These settings control how clients can book on your public booking page. Your time zone is currently set to <span className="font-semibold">Nairobi (EAT)</span>.
            </p>
          </div>
          <CardContent className="p-0">
            <div className="divide-y">
              {schedule.map((day, idx) => (
                <div 
                  key={day.day} 
                  className={`p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${day.active ? 'bg-card' : 'bg-muted/30 grayscale-[0.5]'}`}
                >
                  <div className="flex items-center gap-4 min-w-[140px]">
                    <Switch 
                      checked={day.active} 
                      onCheckedChange={() => toggleDay(idx)} 
                    />
                    <span className={`font-semibold ${day.active ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {day.day}
                    </span>
                  </div>

                  {day.active ? (
                    <div className="flex items-center gap-3 flex-1 md:justify-end">
                      <Select value={day.start} onValueChange={(val) => updateTime(idx, 'start', val)}>
                        <SelectTrigger className="w-[120px] bg-background">
                          <SelectValue placeholder="Start Time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(t => <SelectItem key={`start-${t}`} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">-</span>
                      <Select value={day.end} onValueChange={(val) => updateTime(idx, 'end', val)}>
                        <SelectTrigger className="w-[120px] bg-background">
                          <SelectValue placeholder="End Time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(t => <SelectItem key={`end-${t}`} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground ml-4 w-20 justify-end">
                        <Clock className="w-4 h-4" />
                        <span>9h</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 md:text-right text-sm text-muted-foreground italic pl-12 md:pl-0">
                      Unavailable
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Booking Rules</CardTitle>
            <CardDescription>Control how and when clients can schedule appointments with you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-sm font-medium">Buffer between appointments</label>
                <Select defaultValue="15" onValueChange={() => setHasChanges(true)}>
                  <SelectTrigger className="w-full bg-muted/20">
                    <SelectValue placeholder="Select buffer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Give yourself time to clean up and prepare for the next client.</p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Minimum notice</label>
                <Select defaultValue="2" onValueChange={() => setHasChanges(true)}>
                  <SelectTrigger className="w-full bg-muted/20">
                    <SelectValue placeholder="Select notice period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No minimum (Last minute)</SelectItem>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Avoid surprise bookings by requiring advance notice.</p>
              </div>

              <div className="space-y-3 md:col-span-2">
                <label className="text-sm font-medium">Maximum advance booking</label>
                <Select defaultValue="30" onValueChange={() => setHasChanges(true)}>
                  <SelectTrigger className="w-full md:w-1/2 bg-muted/20">
                    <SelectValue placeholder="Select advance window" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days (1 month)</SelectItem>
                    <SelectItem value="60">60 days (2 months)</SelectItem>
                    <SelectItem value="90">90 days (3 months)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">How far into the future clients can book appointments.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
