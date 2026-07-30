import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";

export const paymentTransactionStatusEnum = pgEnum("payment_transaction_status", [
  "pending",
  "success",
  "failed",
  "refunded",
]);

export const paymentsTable = pgTable("payments", {
  id: text("id").primaryKey(),
  owner_id: text("owner_id").references(() => profilesTable.id, { onDelete: "set null" }),
  reference: text("reference").notNull().unique(),
  amount: integer("amount").notNull(), // in KES cents
  currency: text("currency").default("KES").notNull(),
  plan: text("plan"),
  status: paymentTransactionStatusEnum("status").default("pending").notNull(),
  paystack_customer_code: text("paystack_customer_code"),
  paystack_reference: text("paystack_reference"),
  metadata: text("metadata"), // JSON string
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Payment = typeof paymentsTable.$inferSelect;
export type NewPayment = typeof paymentsTable.$inferInsert;