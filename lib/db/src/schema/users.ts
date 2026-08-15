// @ts-nocheck
import { pgTable, text, timestamp, boolean, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const usersTable = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  password: text("password").notNull(), // hashed with bcrypt
  avatar: text("avatar"), // URL or data URI
  plan: varchar("plan", { length: 50 }).default("free"), // free, pro, enterprise
  credits: text("credits").default("500"), // stored as string to avoid floating point issues
  creditsResetDate: timestamp("credits_reset_date").defaultNow(),
  gitHubConnected: boolean("github_connected").default(false),
  gitHubAccessToken: text("github_access_token"), // encrypted
  gitHubUsername: varchar("github_username", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
