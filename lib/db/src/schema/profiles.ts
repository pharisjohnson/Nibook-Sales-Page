import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "past_due",
  "incomplete",
  "non-renewing",
  "attention",
]);

export const profilesTable = pgTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    business_name: text("business_name"),
    slug: text("slug").unique(),
    phone: text("phone"),
    location: text("location"),
    bio: text("bio"),
    category: text("category"),
    logo_url: text("logo_url"),
    cover_url: text("cover_url"),
    avatar_url: text("avatar_url"),
    onboarding_completed: boolean("onboarding_completed").default(false).notNull(),
    subscription_plan: text("subscription_plan"),
    subscription_status: subscriptionStatusEnum("subscription_status"),
    paystack_customer_code: text("paystack_customer_code"),
    subscription_code: text("subscription_code"),
    subscription_started_at: timestamp("subscription_started_at", { withTimezone: true }),
    mpesa_paybill: text("mpesa_paybill"),
    mpesa_account: text("mpesa_account"),
    whatsapp_enabled: boolean("whatsapp_enabled").default(false).notNull(),
    whatsapp_phone: text("whatsapp_phone"),
    reminder_hours: integer("reminder_hours").default(24).notNull(),
    cancellation_policy: text("cancellation_policy"),
    booking_widget_theme: text("booking_widget_theme"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("profiles_slug_idx").on(table.slug),
    emailIdx: uniqueIndex("profiles_email_idx").on(table.email),
  })
);

export type Profile = typeof profilesTable.$inferSelect;
export type NewProfile = typeof profilesTable.$inferInsert;