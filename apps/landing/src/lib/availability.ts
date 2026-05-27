import { apiFetch } from "./api";

export const DEFAULT_WEEKLY_SCHEDULE = [
  { day: "Monday", active: true, start: "8:00 AM", end: "6:00 PM" },
  { day: "Tuesday", active: true, start: "8:00 AM", end: "6:00 PM" },
  { day: "Wednesday", active: true, start: "9:00 AM", end: "5:00 PM" },
  { day: "Thursday", active: true, start: "8:00 AM", end: "6:00 PM" },
  { day: "Friday", active: true, start: "8:00 AM", end: "7:00 PM" },
  { day: "Saturday", active: true, start: "9:00 AM", end: "4:00 PM" },
  { day: "Sunday", active: false, start: "10:00 AM", end: "2:00 PM" },
] as const;

export type DaySchedule = {
  day: string;
  active: boolean;
  start: string;
  end: string;
};

export async function saveWeeklySchedule(ownerId: string, schedule: DaySchedule[]) {
  return apiFetch(`/availability/${ownerId}/schedule`, {
    method: "PUT",
    body: JSON.stringify({
      schedule: schedule.map((s, i) => ({
        day_name: s.day,
        is_active: s.active,
        start_time: s.start,
        end_time: s.end,
        sort_order: i,
      })),
    }),
  });
}

export async function saveDefaultBookingRules(ownerId: string) {
  return apiFetch(`/availability/${ownerId}/rules`, {
    method: "PUT",
    body: JSON.stringify({
      buffer_minutes: 15,
      min_notice_hours: 2,
      max_advance_days: 30,
      cancellation_window_hours: 24,
    }),
  });
}
