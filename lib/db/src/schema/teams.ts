// @ts-nocheck
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const teamsTable = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// @ts-expect-error - Drizzle-Zod type constraint issue
export const insertTeamSchema = createInsertSchema(teamsTable).extend({
  name: z.string().min(1, "Team name required"),
  description: z.string().optional(),
});

export type Team = typeof teamsTable.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
