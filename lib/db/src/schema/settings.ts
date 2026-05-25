// lib/db/src/schema/settings.ts

import {pgTable, text, serial, boolean, decimal} from "drizzle-orm/pg-core";
import {createInsertSchema} from "drizzle-zod";
import {z} from "zod/v4";

// Define Settings table

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),  // Foreign key to users table
  storageBucket: text("storage_bucket"),  // Cloud storage config
  apiKey: text("api_key"),  // API authentication
  theme: text("theme").default("light"),  // UI theme
  notificationEmail: boolean("notification_email").default(false),  // Email opt-in
  timezone: text("timezone"),  // User timezone
  maxFileSize: decimal("max_file_size").default("10.0"),  // File upload limit (MB)
  analyticsEnabled: boolean("analytics_enabled").default(true),  // Data tracking
});

// Create insert schema (exclude ID for inserts)
export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;