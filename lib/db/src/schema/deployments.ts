// @ts-nocheck
import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";
import { projectsTable } from "./projects";

export const deploymentsTable = pgTable("deployments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => usersTable.id).notNull(),
  projectId: varchar("project_id", { length: 36 }).references(() => projectsTable.id).notNull(),
  provider: varchar("provider", { length: 100 }).notNull(), // vercel, railway, render, netlify, etc
  status: varchar("status", { length: 50 }).default("building"), // building, deploying, live, failed, paused
  externalId: varchar("external_id", { length: 500 }), // deployment ID from provider
  url: varchar("url", { length: 500 }), // live deployment URL
  logs: text("logs"), // deployment logs
  error: text("error"), // error message if failed
  environment: text("environment"), // JSON string of env vars
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDeploymentSchema = createInsertSchema(deploymentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Deployment = typeof deploymentsTable.$inferSelect;
export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
