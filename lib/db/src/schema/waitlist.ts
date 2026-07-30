import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const waitlistTable = pgTable("waitlist", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Waitlist = typeof waitlistTable.$inferSelect;
export type NewWaitlist = typeof waitlistTable.$inferInsert;