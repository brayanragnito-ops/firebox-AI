// @ts-nocheck
import { pgTable, text, timestamp, varchar, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

export const usageTable = pgTable("usage", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => usersTable.id).notNull(),
  date: date("date").notNull(), // YYYY-MM-DD for daily tracking
  agentRunTokens: integer("agent_run_tokens").default(0),
  computeMinutes: integer("compute_minutes").default(0),
  apiCalls: integer("api_calls").default(0),
  costUSD: text("cost_usd").default("0"), // stored as string for precision
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUsageSchema = createInsertSchema(usageTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Usage = typeof usageTable.$inferSelect;
export type InsertUsage = z.infer<typeof insertUsageSchema>;
