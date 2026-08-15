// @ts-nocheck
import { pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

export const projectsTable = pgTable("projects", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => usersTable.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  slug: varchar("slug", { length: 255 }).notNull(), // unique per user
  source: varchar("source", { length: 50 }).notNull(), // "prompt", "github", "zip"
  repository: varchar("repository", { length: 500 }), // GitHub URL if imported
  status: varchar("status", { length: 50 }).default("ready"), // ready, running, needs-setup, deploying, error
  framework: varchar("framework", { length: 255 }),
  language: varchar("language", { length: 100 }), // TypeScript, Python, Go, etc
  runtime: varchar("runtime", { length: 100 }), // Node.js 20, Python 3.12, etc
  packageManager: varchar("package_manager", { length: 100 }), // npm, pnpm, pip, etc
  buildTool: varchar("build_tool", { length: 100 }), // Vite, Turbopack, etc
  devCommand: varchar("dev_command", { length: 255 }),
  buildCommand: varchar("build_command", { length: 255 }),
  startCommand: varchar("start_command", { length: 255 }),
  publicPath: varchar("public_path", { length: 255 }).default("/"),
  port: integer("port").default(3000),
  filesPath: varchar("files_path", { length: 500 }), // local directory path
  gitBranch: varchar("git_branch", { length: 255 }).default("main"),
  color: varchar("color", { length: 7 }).default("#7c5cff"), // for UI
  visibility: varchar("visibility", { length: 50 }).default("private"), // private, shared, public
  lastRun: timestamp("last_run"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Project = typeof projectsTable.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
