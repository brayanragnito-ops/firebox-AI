// @ts-nocheck
import { pgTable, text, timestamp, uuid, integer, numeric, json } from "drizzle-orm/pg-core";
import { deploymentsTable } from "./deployments";
import { projectsTable } from "./projects";

export const deploymentLogsTable = pgTable("deployment_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  deploymentId: uuid("deployment_id")
    .notNull()
    .references(() => deploymentsTable.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  level: text("level", { enum: ["info", "warn", "error"] }).default("info"),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// @ts-expect-error - Drizzle-Zod type constraint issue
export const insertDeploymentLogSchema = createInsertSchema(deploymentLogsTable).extend({
  deploymentId: z.string().uuid("Invalid deployment ID"),
  projectId: z.string(),
  level: z.enum(["info", "warn", "error"]).default("info"),
  message: z.string().min(1, "Message required"),
});

export type DeploymentLog = typeof deploymentLogsTable.$inferSelect;
export type InsertDeploymentLog = z.infer<typeof insertDeploymentLogSchema>;
