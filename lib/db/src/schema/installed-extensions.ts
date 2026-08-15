// @ts-nocheck
import {
  pgTable,
  uuid,
  timestamp,
  json,
  boolean,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";
import { extensionsTable } from "./extensions";

export const installedExtensionsTable = pgTable(
  "installed_extensions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull(),
    extensionId: uuid("extension_id").notNull(),
    configuration: json("configuration").$type<Record<string, any>>(),
    version: json("version").$type<string>(),
    enabled: boolean("enabled").notNull().default(true),
    installedAt: timestamp("installed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_installed_extensions_project_id").on(table.projectId),
    index("idx_installed_extensions_extension_id").on(table.extensionId),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectsTable.id],
      name: "installed_extensions_project_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.extensionId],
      foreignColumns: [extensionsTable.id],
      name: "installed_extensions_extension_id_fk",
    }).onDelete("cascade"),
  ]
);

// @ts-expect-error - Drizzle createInsertSchema type constraint
export const insertInstalledExtensionSchema = createInsertSchema(
  installedExtensionsTable
).pick({
  projectId: true,
  extensionId: true,
  configuration: true,
  version: true,
  enabled: true,
});

export type InstalledExtension = typeof installedExtensionsTable.$inferSelect;
export type InsertInstalledExtension = z.infer<typeof insertInstalledExtensionSchema>;
