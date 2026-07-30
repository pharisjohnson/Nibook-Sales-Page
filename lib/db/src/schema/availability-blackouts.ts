import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";

export const availabilityBlackoutsTable = pgTable("availability_blackouts", {
  id: text("id").primaryKey(),
  owner_id: text("owner_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  reason: text("reason"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AvailabilityBlackout = typeof availabilityBlackoutsTable.$inferSelect;
export type NewAvailabilityBlackout = typeof availabilityBlackoutsTable.$inferInsert;