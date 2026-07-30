import { pgTable, text, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";

export const serviceStatusEnum = pgEnum("service_status", ["active", "inactive", "archived"]);

export const servicesTable = pgTable("services", {
  id: text("id").primaryKey(),
  owner_id: text("owner_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").default(0).notNull(),
  duration_minutes: integer("duration_minutes").default(60).notNull(),
  image_url: text("image_url"),
  is_active: boolean("is_active").default(true).notNull(),
  status: serviceStatusEnum("status").default("active").notNull(),
  sort_order: integer("sort_order").default(0).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Service = typeof servicesTable.$inferSelect;
export type NewService = typeof servicesTable.$inferInsert;