// @ts-nocheck
import { pgTable, text, timestamp, uuid, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { teamsTable } from "./teams";

export const teamMembersTable = pgTable(
  "team_members",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => teamsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "editor", "viewer"] })
      .notNull()
      .default("viewer"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.teamId, table.userId] }),
  })
);

// @ts-expect-error - Drizzle-Zod type constraint issue
export const insertTeamMemberSchema = createInsertSchema(teamMembersTable).extend(
  {
    teamId: z.string().uuid("Invalid team ID"),
    userId: z.string().uuid("Invalid user ID"),
    role: z.enum(["owner", "editor", "viewer"]).default("viewer"),
  }
);

export type TeamMember = typeof teamMembersTable.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamRole = "owner" | "editor" | "viewer";
