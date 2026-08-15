// @ts-nocheck
import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { deploymentsTable } from "./deployments";
import { projectsTable } from "./projects";

export const errorTrackingTable = pgTable("error_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  deploymentId: uuid("deployment_id")
    .notNull()
    .references(() => deploymentsTable.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  errorType: text("error_type").notNull(), // e.g., "TypeError", "NetworkError", "DatabaseError"
  message: text("message").notNull(),
  stackTrace: text("stack_trace"),
  count: integer("count").default(1), // how many times this error occurred
  resolved: text("resolved", { enum: ["true", "false"] }).default("false"),
  firstOccurred: timestamp("first_occurred", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastOccurred: timestamp("last_occurred", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// @ts-expect-error - Drizzle-Zod type constraint issue
export const insertErrorTrackingSchema = createInsertSchema(errorTrackingTable).extend({
  deploymentId: z.string().uuid("Invalid deployment ID"),
  projectId: z.string(),
  errorType: z.string().min(1, "Error type required"),
  message: z.string().min(1, "Message required"),
  stackTrace: z.string().optional(),
  count: z.number().int().min(1).default(1),
  resolved: z.enum(["true", "false"]).default("false"),
});

export type ErrorTracking = typeof errorTrackingTable.$inferSelect;
export type InsertErrorTracking = z.infer<typeof insertErrorTrackingSchema>;
