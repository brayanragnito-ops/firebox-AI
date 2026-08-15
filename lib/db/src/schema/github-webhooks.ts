// @ts-nocheck
import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  json,
  boolean,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const githubWebhooksTable = pgTable(
  "github_webhooks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull(),
    userId: uuid("user_id").notNull(),
    webhookId: varchar("webhook_id", { length: 255 }).notNull().unique(),
    eventType: varchar("event_type", {
      enum: ["push", "pull_request", "release", "workflow_dispatch", "workflow_run"],
    })
      .notNull(),
    repository: varchar("repository", { length: 255 }).notNull(),
    branch: varchar("branch", { length: 255 }),
    triggerAction: varchar("trigger_action", { length: 255 }), // opened, closed, synchronize, etc.
    payload: json("payload").$type<Record<string, any>>(),
    isActive: boolean("is_active").notNull().default(true),
    autoDeployEnabled: boolean("auto_deploy_enabled").notNull().default(false),
    deployBranches: json("deploy_branches").$type<string[]>().default([]),
    lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
    triggerCount: json("trigger_count").$type<{
      push?: number;
      pull_request?: number;
      release?: number;
      workflow_dispatch?: number;
      workflow_run?: number;
    }>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_github_webhooks_project_id").on(table.projectId),
    index("idx_github_webhooks_user_id").on(table.userId),
    index("idx_github_webhooks_is_active").on(table.isActive),
    index("idx_github_webhooks_webhook_id").on(table.webhookId),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectsTable.id],
      name: "github_webhooks_project_id_fk",
    }).onDelete("cascade"),
  ]
);

// @ts-expect-error - Drizzle createInsertSchema type constraint
export const insertGithubWebhookSchema = createInsertSchema(githubWebhooksTable).pick({
  projectId: true,
  userId: true,
  webhookId: true,
  eventType: true,
  repository: true,
  branch: true,
  triggerAction: true,
  payload: true,
  isActive: true,
  autoDeployEnabled: true,
  deployBranches: true,
  lastTriggeredAt: true,
  triggerCount: true,
});

export type GithubWebhook = typeof githubWebhooksTable.$inferSelect;
export type InsertGithubWebhook = z.infer<typeof insertGithubWebhookSchema>;
