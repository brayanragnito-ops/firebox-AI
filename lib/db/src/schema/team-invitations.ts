// @ts-nocheck
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { teamsTable } from "./teams";
import { usersTable } from "./users";

export const teamInvitationsTable = pgTable("team_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teamsTable.id, { onDelete: "cascade" }),
  invitedEmail: text("invited_email").notNull(),
  invitedBy: uuid("invited_by")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["owner", "editor", "viewer"] })
    .notNull()
    .default("viewer"),
  token: text("token").notNull().unique(),
  acceptedBy: uuid("accepted_by"),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// @ts-expect-error - Drizzle-Zod type constraint issue
export const insertTeamInvitationSchema = createInsertSchema(
  teamInvitationsTable
).extend({
  teamId: z.string().uuid("Invalid team ID"),
  invitedEmail: z.string().email("Invalid email"),
  invitedBy: z.string().uuid("Invalid user ID"),
  role: z.enum(["owner", "editor", "viewer"]).default("viewer"),
  token: z.string(),
  expiresAt: z.date(),
});

export type TeamInvitation = typeof teamInvitationsTable.$inferSelect;
export type InsertTeamInvitation = z.infer<typeof insertTeamInvitationSchema>;
