// @ts-nocheck
import { pgTable, text, timestamp, uuid, numeric } from "drizzle-orm/pg-core";
import { deploymentsTable } from "./deployments";
import { projectsTable } from "./projects";

export const performanceMetricsTable = pgTable("performance_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  deploymentId: uuid("deployment_id")
    .notNull()
    .references(() => deploymentsTable.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  cpuUsage: numeric("cpu_usage", { precision: 5, scale: 2 }), // percentage
  memoryUsage: numeric("memory_usage", { precision: 5, scale: 2 }), // percentage
  latency: numeric("latency", { precision: 8, scale: 2 }), // milliseconds
  requestsPerSecond: numeric("requests_per_second", { precision: 8, scale: 2 }),
  errorRate: numeric("error_rate", { precision: 5, scale: 2 }), // percentage
  uptime: numeric("uptime", { precision: 8, scale: 2 }), // percentage
  timestamp: timestamp("timestamp", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// @ts-expect-error - Drizzle-Zod type constraint issue
export const insertPerformanceMetricSchema = createInsertSchema(performanceMetricsTable).extend({
  deploymentId: z.string().uuid("Invalid deployment ID"),
  projectId: z.string(),
  cpuUsage: z.number().min(0).max(100).optional(),
  memoryUsage: z.number().min(0).max(100).optional(),
  latency: z.number().min(0).optional(),
  requestsPerSecond: z.number().min(0).optional(),
  errorRate: z.number().min(0).max(100).optional(),
  uptime: z.number().min(0).max(100).optional(),
});

export type PerformanceMetric = typeof performanceMetricsTable.$inferSelect;
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;
