// @ts-nocheck
import { boolean, integer, json, pgTable, real, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { projectsTable } from "./projects";

export const extensionsTable = pgTable("extensions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }),
  description: text("description").notNull(),
  longDescription: text("long_description"),
  category: varchar("category", { length: 100 }).notNull(),
  version: varchar("version", { length: 25 }).default("1.0.0"),
  author: varchar("author", { length: 255 }),
  authorEmail: varchar("author_email", { length: 255 }),
  license: varchar("license", { length: 100 }).default("MIT"),
  icon: text("icon"),
  tags: text("tags").default("[]"),
  code: text("code").notNull(),
  configuration: json("configuration").default({}),
  dependencies: json("dependencies").default({}),
  compatibleFrameworks: text("compatible_frameworks").default("[]"),
  isPublished: boolean("is_published").default(true),
  isFeatured: boolean("is_featured").default(false),
  isVerified: boolean("is_verified").default(false),
  rating: real("rating").default(0),
  ratingCount: integer("rating_count").default(0),
  downloadCount: integer("download_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertExtensionSchema = createInsertSchema(extensionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Extension = typeof extensionsTable.$inferSelect;
export type InsertExtension = z.infer<typeof insertExtensionSchema>;

export const installedExtensionsTable = pgTable("installed_extensions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  projectId: varchar("project_id", { length: 36 }).references(() => projectsTable.id).notNull(),
  extensionId: varchar("extension_id", { length: 36 }).references(() => extensionsTable.id).notNull(),
  configuration: json("configuration").default({}),
  enabled: boolean("enabled").default(true),
  installedAt: timestamp("installed_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInstalledExtensionSchema = createInsertSchema(installedExtensionsTable).omit({
  id: true,
  installedAt: true,
  updatedAt: true,
});

export type InstalledExtension = typeof installedExtensionsTable.$inferSelect;
export type InsertInstalledExtension = z.infer<typeof insertInstalledExtensionSchema>;
