// @ts-nocheck
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  json,
  boolean,
  varchar,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { projectsTable } from "./projects";

export const cicdRunsTable = pgTable(
  "cicd_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull(),
    userId: uuid("user_id").notNull(),
    workflowName: varchar("workflow_name", { length: 255 }).notNull(),
    workflowFile: varchar("workflow_file", { length: 255 }).notNull(), // .github/workflows/deploy.yml
    status: varchar("status", {
      enum: ["pending", "running", "success", "failed", "cancelled"],
    })
      .notNull()
      .default("pending"),
    triggerEvent: varchar("trigger_event", {
      enum: ["push", "pull_request", "manual", "schedule"],
    })
      .notNull()
      .default("manual"),
    branch: varchar("branch", { length: 255 }).notNull().default("main"),
    commitSha: varchar("commit_sha", { length: 40 }).notNull(),
    commitMessage: text("commit_message"),
    commitAuthor: varchar("commit_author", { length: 255 }),
    runNumber: integer("run_number").notNull(),
    conclusion: varchar("conclusion", {
      enum: ["success", "failure", "cancelled", "skipped", "neutral", null],
    }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds"),
    logs: text("logs"),
    artifacts: json("artifacts").$type<{ name: string; path: string }[]>(),
    environmentVariables: json("environment_variables").$type<Record<string, string>>(),
    jobsCount: integer("jobs_count").notNull().default(0),
    successCount: integer("success_count").notNull().default(0),
    failureCount: integer("failure_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_cicd_runs_project_id").on(table.projectId),
    index("idx_cicd_runs_user_id").on(table.userId),
    index("idx_cicd_runs_status").on(table.status),
    index("idx_cicd_runs_created_at").on(table.createdAt),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectsTable.id],
      name: "cicd_runs_project_id_fk",
    }).onDelete("cascade"),
  ]
);

// @ts-expect-error - Drizzle createInsertSchema type constraint
export const insertCicdRunSchema = createInsertSchema(cicdRunsTable).pick({
  projectId: true,
  userId: true,
  workflowName: true,
  workflowFile: true,
  status: true,
  triggerEvent: true,
  branch: true,
  commitSha: true,
  commitMessage: true,
  commitAuthor: true,
  runNumber: true,
  conclusion: true,
  startedAt: true,
  completedAt: true,
  durationSeconds: true,
  logs: true,
  artifacts: true,
  environmentVariables: true,
  jobsCount: true,
  successCount: true,
  failureCount: true,
});

export type CicdRun = typeof cicdRunsTable.$inferSelect;
export type InsertCicdRun = z.infer<typeof insertCicdRunSchema>;
