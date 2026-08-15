// @ts-nocheck
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  json,
  decimal,
  boolean,
  index,
} from "drizzle-orm/pg-core";

export const extensionsTable = pgTable(
  "extensions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    longDescription: text("long_description"),
    category: varchar("category", {
      enum: [
        "code-generation",
        "documentation",
        "testing",
        "deployment",
        "monitoring",
        "security",
        "performance",
        "styling",
        "utilities",
      ],
    })
      .notNull()
      .default("utilities"),
    version: varchar("version", { length: 50 }).notNull().default("1.0.0"),
    author: varchar("author", { length: 255 }).notNull(),
    authorEmail: varchar("author_email", { length: 255 }),
    authorWebsite: varchar("author_website", { length: 255 }),
    license: varchar("license", { length: 50 }).notNull().default("MIT"),
    homepage: varchar("homepage", { length: 255 }),
    repository: varchar("repository", { length: 255 }),
    icon: varchar("icon", { length: 500 }), // URL to icon
    tags: json("tags").$type<string[]>().default([]),
    code: text("code").notNull(), // Extension code/implementation
    configuration: json("configuration").$type<Record<string, any>>(), // Default config
    dependencies: json("dependencies").$type<Record<string, string>>().default({}), // npm dependencies
    compatibleFrameworks: json("compatible_frameworks").$type<string[]>().default([]),
    rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
    ratingCount: integer("rating_count").notNull().default(0),
    downloadCount: integer("download_count").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(true),
    isVerified: boolean("is_verified").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_extensions_category").on(table.category),
    index("idx_extensions_author").on(table.author),
    index("idx_extensions_rating").on(table.rating),
    index("idx_extensions_download_count").on(table.downloadCount),
    index("idx_extensions_is_published").on(table.isPublished),
    index("idx_extensions_is_featured").on(table.isFeatured),
  ]
);

// @ts-expect-error - Drizzle createInsertSchema type constraint
export const insertExtensionSchema = createInsertSchema(extensionsTable).pick({
  name: true,
  displayName: true,
  description: true,
  longDescription: true,
  category: true,
  version: true,
  author: true,
  authorEmail: true,
  authorWebsite: true,
  license: true,
  homepage: true,
  repository: true,
  icon: true,
  tags: true,
  code: true,
  configuration: true,
  dependencies: true,
  compatibleFrameworks: true,
  isPublished: true,
  isVerified: true,
  isFeatured: true,
});

export type Extension = typeof extensionsTable.$inferSelect;
export type InsertExtension = z.infer<typeof insertExtensionSchema>;
