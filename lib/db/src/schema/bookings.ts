import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";
import { servicesTable } from "./services";
import { teamMembersTable } from "./team-members";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no-show",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "pending",
  "paid",
  "refunded",
  "failed",
]);

export const bookingsTable = pgTable("bookings", {
  id: text("id").primaryKey(),
  owner_id: text("owner_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  service_id: text("service_id").references(() => servicesTable.id, { onDelete: "set null" }),
  client_name: text("client_name").notNull(),
  client_phone: text("client_phone"),
  client_email: text("client_email"),
  scheduled_at: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  duration_minutes: integer("duration_minutes").default(60).notNull(),
  notes: text("notes"),
  amount: integer("amount"),
  payment_status: paymentStatusEnum("payment_status").default("unpaid").notNull(),
  status: bookingStatusEnum("status").default("pending").notNull(),
  staff_id: text("staff_id").references(() => teamMembersTable.id, { onDelete: "set null" }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Booking = typeof bookingsTable.$inferSelect;
export type NewBooking = typeof bookingsTable.$inferInsert;