import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";

export const availabilitySchedulesTable = pgTable("availability_schedules", {
  id: text("id").primaryKey(),
  owner_id: text("owner_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  day_name: text("day_name").notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  start_time: text("start_time").notNull(),
  end_time: text("end_time").notNull(),
  sort_order: integer("sort_order").default(0).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AvailabilitySchedule = typeof availabilitySchedulesTable.$inferSelect;
export type NewAvailabilitySchedule = typeof availabilitySchedulesTable.$inferInsert;