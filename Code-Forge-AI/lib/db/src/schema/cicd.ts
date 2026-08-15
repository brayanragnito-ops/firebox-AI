// @ts-nocheck
import { boolean, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { projectsTable } from "./projects";
import { usersTable } from "./users";

export const cicdRunsTable = pgTable("cicd_runs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  projectId: varchar("project_id", { length: 36 }).references(() => projectsTable.id).notNull(),
  userId: varchar("user_id", { length: 36 }).references(() => usersTable.id).notNull(),
  workflowName: varchar("workflow_name", { length: 255 }).notNull(),
  workflowFile: varchar("workflow_file", { length: 255 }),
  status: varchar("status", { length: 50 }).default("pending"),
  triggerEvent: varchar("trigger_event", { length: 50 }).default("manual"),
  branch: varchar("branch", { length: 255 }).default("main"),
  commitSha: varchar("commit_sha", { length: 255 }),
  commitMessage: text("commit_message"),
  commitAuthor: varchar("commit_author", { length: 255 }),
  runNumber: integer("run_number").default(0),
  durationSeconds: integer("duration_seconds").default(0),
  conclusion: varchar("conclusion", { length: 50 }),
  environmentVariables: text("environment_variables").default("{}"),
  jobsCount: integer("jobs_count").default(0),
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
  logs: text("logs"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertCicdRunSchema = createInsertSchema(cicdRunsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CicdRun = typeof cicdRunsTable.$inferSelect;
export type InsertCicdRun = z.infer<typeof insertCicdRunSchema>;

export const githubWebhooksTable = pgTable("github_webhooks", {
  id: varchar("id", { length: 36 }).primaryKey(),
  projectId: varchar("project_id", { length: 36 }).references(() => projectsTable.id).notNull(),
  userId: varchar("user_id", { length: 36 }).references(() => usersTable.id).notNull(),
  webhookId: varchar("webhook_id", { length: 255 }).notNull().unique(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  repository: varchar("repository", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true),
  autoDeployEnabled: boolean("auto_deploy_enabled").default(false),
  deployBranches: text("deploy_branches").default("[]"),
  triggerCount: integer("trigger_count").default(0),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGithubWebhookSchema = createInsertSchema(githubWebhooksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type GithubWebhook = typeof githubWebhooksTable.$inferSelect;
export type InsertGithubWebhook = z.infer<typeof insertGithubWebhookSchema>;
