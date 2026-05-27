import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";
import type { DaySchedule } from "@/lib/availability";

const TIME_OPTIONS = [
  "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM",
];

type Props = {
  schedule: DaySchedule[];
  onChange: (schedule: DaySchedule[]) => void;
};

export function OnboardingAvailabilityStep({ schedule, onChange }: Props) {
  function toggleDay(index: number) {
    const next = [...schedule];
    next[index] = { ...next[index], active: !next[index].active };
    onChange(next);
  }

  function updateTime(index: number, field: "start" | "end", value: string) {
    const next = [...schedule];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden divide-y">
      <div className="bg-primary/5 px-4 py-3 flex items-center gap-2 text-sm text-foreground/80">
        <Clock className="w-4 h-4 text-primary shrink-0" />
        <span>Clients book in <strong>Nairobi (EAT)</strong>. Adjust hours anytime in Availability.</span>
      </div>
      {schedule.map((day, idx) => (
        <div
          key={day.day}
          className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 ${day.active ? "bg-card" : "bg-muted/30"}`}
        >
          <div className="flex items-center gap-3 min-w-[130px]">
            <Switch checked={day.active} onCheckedChange={() => toggleDay(idx)} />
            <span className={`text-sm font-medium ${day.active ? "" : "text-muted-foreground"}`}>{day.day}</span>
          </div>
          {day.active ? (
            <div className="flex items-center gap-2 flex-1 sm:justify-end">
              <Select value={day.start} onValueChange={v => updateTime(idx, "start", v)}>
                <SelectTrigger className="w-[118px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{TIME_OPTIONS.map(t => <SelectItem key={`s-${day.day}-${t}`} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <span className="text-muted-foreground text-sm">–</span>
              <Select value={day.end} onValueChange={v => updateTime(idx, "end", v)}>
                <SelectTrigger className="w-[118px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{TIME_OPTIONS.map(t => <SelectItem key={`e-${day.day}-${t}`} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground italic sm:ml-auto">Closed</span>
          )}
        </div>
      ))}
    </div>
  );
}
