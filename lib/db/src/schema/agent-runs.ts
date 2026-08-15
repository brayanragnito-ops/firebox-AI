// @ts-nocheck
import { pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";
import { projectsTable } from "./projects";

export const agentRunsTable = pgTable("agent_runs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => usersTable.id).notNull(),
  projectId: varchar("project_id", { length: 36 }).references(() => projectsTable.id).notNull(),
  agent: varchar("agent", { length: 100 }).notNull(), // spark, forge, nexus, titan, aura, pulse, vertex, vanguard
  prompt: text("prompt").notNull(),
  status: varchar("status", { length: 50 }).default("running"), // running, completed, failed
  activities: text("activities"), // JSON array of activity events
  tokensUsed: integer("tokens_used").default(0),
  creditsCharged: text("credits_charged").default("0"), // stored as string
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgentRunSchema = createInsertSchema(agentRunsTable).omit({
  id: true,
  createdAt: true,
});

export type AgentRun = typeof agentRunsTable.$inferSelect;
export type InsertAgentRun = z.infer<typeof insertAgentRunSchema>;
