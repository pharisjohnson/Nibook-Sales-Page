import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";

export const availabilityRulesTable = pgTable("availability_rules", {
  id: text("id").primaryKey(),
  owner_id: text("owner_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" })
    .unique(),
  min_booking_notice_hours: integer("min_booking_notice_hours").default(1).notNull(),
  max_booking_window_days: integer("max_booking_window_days").default(30).notNull(),
  buffer_minutes: integer("buffer_minutes").default(0).notNull(),
  allow_same_day_booking: boolean("allow_same_day_booking").default(true).notNull(),
  require_confirmation: boolean("require_confirmation").default(false).notNull(),
  cancellation_policy: text("cancellation_policy"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AvailabilityRules = typeof availabilityRulesTable.$inferSelect;
export type NewAvailabilityRules = typeof availabilityRulesTable.$inferInsert;