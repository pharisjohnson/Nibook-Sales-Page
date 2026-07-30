import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";

export const inviteStatusEnum = pgEnum("invite_status", ["pending", "accepted", "expired", "revoked"]);

export const teamInvitesTable = pgTable("team_invites", {
  id: text("id").primaryKey(),
  owner_id: text("owner_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull(),
  status: inviteStatusEnum("status").default("pending").notNull(),
  token: text("token").notNull().unique(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type TeamInvite = typeof teamInvitesTable.$inferSelect;
export type NewTeamInvite = typeof teamInvitesTable.$inferInsert;