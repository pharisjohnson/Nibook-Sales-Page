import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";

export const teamRoleEnum = pgEnum("team_role", ["admin", "manager", "staff", "viewer"]);

export const teamMembersTable = pgTable("team_members", {
  id: text("id").primaryKey(),
  owner_id: text("owner_id")
    .notNull()
    .references(() => profilesTable.id, { onDelete: "cascade" }),
  user_id: text("user_id"),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: teamRoleEnum("role").default("staff").notNull(),
  phone: text("phone"),
  avatar_url: text("avatar_url"),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type TeamMember = typeof teamMembersTable.$inferSelect;
export type NewTeamMember = typeof teamMembersTable.$inferInsert;