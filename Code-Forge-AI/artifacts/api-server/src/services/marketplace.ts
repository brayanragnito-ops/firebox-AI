import {
  db,
  extensionsTable,
  installedExtensionsTable,
  projectsTable,
} from "@workspace/db";
import { eq, and, desc, like, inArray } from "drizzle-orm";
import type {
  Extension,
  InsertExtension,
  InstalledExtension,
  InsertInstalledExtension,
} from "@workspace/db";

// Extensions Marketplace Management

export async function createExtension(extension: InsertExtension): Promise<Extension> {
  const [created] = await db
    .insert(extensionsTable)
    .values(extension)
    .returning();
  return created;
}

export async function getExtensionById(extensionId: string): Promise<Extension | undefined> {
  const [extension] = await db
    .select()
    .from(extensionsTable)
    .where(eq(extensionsTable.id, extensionId))
    .limit(1);
  return extension;
}

export async function getExtensionByName(name: string): Promise<Extension | undefined> {
  const [extension] = await db
    .select()
    .from(extensionsTable)
    .where(eq(extensionsTable.name, name))
    .limit(1);
  return extension;
}

export async function searchExtensions(
  query?: string,
  category?: string,
  limit: number = 50
): Promise<Extension[]> {
  let baseQuery: any = db.select().from(extensionsTable).where(eq(extensionsTable.isPublished, true));

  if (category) {
    baseQuery = baseQuery.where(eq(extensionsTable.category, category as any));
  }

  if (query) {
    baseQuery = baseQuery.where(like(extensionsTable.name, `%${query}%`));
  }

  return await baseQuery
    .orderBy(
      desc(extensionsTable.isFeatured),
      desc(extensionsTable.downloadCount),
      desc(extensionsTable.rating)
    )
    .limit(limit);
}

export async function getFeaturedExtensions(limit: number = 12): Promise<Extension[]> {
  return await db
    .select()
    .from(extensionsTable)
    .where(
      and(eq(extensionsTable.isPublished, true), eq(extensionsTable.isFeatured, true))
    )
    .orderBy(desc(extensionsTable.downloadCount))
    .limit(limit);
}

export async function getExtensionsByCategory(
  category: string,
  limit: number = 50
): Promise<Extension[]> {
  return await db
    .select()
    .from(extensionsTable)
    .where(
      and(
        eq(extensionsTable.isPublished, true),
        eq(extensionsTable.category, category as any)
      )
    )
    .orderBy(desc(extensionsTable.rating), desc(extensionsTable.downloadCount))
    .limit(limit);
}

export async function getPopularExtensions(limit: number = 20): Promise<Extension[]> {
  return await db
    .select()
    .from(extensionsTable)
    .where(eq(extensionsTable.isPublished, true))
    .orderBy(desc(extensionsTable.downloadCount), desc(extensionsTable.rating))
    .limit(limit);
}

export async function getTopRatedExtensions(limit: number = 20): Promise<Extension[]> {
  return await db
    .select()
    .from(extensionsTable)
    .where(eq(extensionsTable.isPublished, true))
    .orderBy(desc(extensionsTable.rating), desc(extensionsTable.ratingCount))
    .limit(limit);
}

export async function updateExtensionRating(
  extensionId: string,
  newRating: number
): Promise<Extension | undefined> {
  const extension = await getExtensionById(extensionId);
  if (!extension) return undefined;

  // Calculate weighted average
  const totalRatings = extension.ratingCount + 1;
  const currentRating = extension.rating ?? 0;
  const currentTotal = parseFloat(currentRating.toString()) * extension.ratingCount;
  const newTotal = currentTotal + newRating;
  const avgRating = (newTotal / totalRatings).toFixed(2);

  const [updated] = await db
    .update(extensionsTable)
    .set({
      rating: parseFloat(avgRating) as any,
      ratingCount: totalRatings,
      updatedAt: new Date(),
    })
    .where(eq(extensionsTable.id, extensionId))
    .returning();

  return updated;
}

export async function incrementDownloadCount(extensionId: string): Promise<void> {
  const { sql } = await import("drizzle-orm");
  await db
    .update(extensionsTable)
    .set({
      downloadCount: sql<number>`download_count + 1`,
      updatedAt: new Date(),
    })
    .where(eq(extensionsTable.id, extensionId));
}

export async function updateExtension(
  extensionId: string,
  updates: Partial<InsertExtension>
): Promise<Extension | undefined> {
  const [updated] = await db
    .update(extensionsTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(extensionsTable.id, extensionId))
    .returning();

  return updated;
}

export async function deleteExtension(extensionId: string): Promise<void> {
  await db.delete(extensionsTable).where(eq(extensionsTable.id, extensionId));
}

// Installed Extensions Management

export async function installExtension(
  installation: InsertInstalledExtension
): Promise<InstalledExtension> {
  // Check if already installed
  const existing = await db
    .select()
    .from(installedExtensionsTable)
    .where(
      and(
        eq(installedExtensionsTable.projectId, installation.projectId),
        eq(installedExtensionsTable.extensionId, installation.extensionId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Re-enable if already installed
    const [updated] = await db
      .update(installedExtensionsTable)
      .set({ enabled: true, updatedAt: new Date() })
      .where(eq(installedExtensionsTable.id, existing[0].id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(installedExtensionsTable)
    .values(installation)
    .returning();

  // Increment download count
  await incrementDownloadCount(installation.extensionId);

  return created;
}

export async function uninstallExtension(
  projectId: string,
  extensionId: string
): Promise<void> {
  await db
    .delete(installedExtensionsTable)
    .where(
      and(
        eq(installedExtensionsTable.projectId, projectId),
        eq(installedExtensionsTable.extensionId, extensionId)
      )
    );
}

export async function getInstalledExtensions(projectId: string): Promise<InstalledExtension[]> {
  return await db
    .select()
    .from(installedExtensionsTable)
    .where(eq(installedExtensionsTable.projectId, projectId))
    .orderBy(desc(installedExtensionsTable.installedAt));
}

export async function getInstalledExtensionDetails(
  projectId: string,
  extensionId: string
): Promise<(InstalledExtension & { extension: Extension }) | undefined> {
  const [result] = await db
    .select({
      installed: installedExtensionsTable,
      extension: extensionsTable,
    })
    .from(installedExtensionsTable)
    .innerJoin(
      extensionsTable,
      eq(installedExtensionsTable.extensionId, extensionsTable.id)
    )
    .where(
      and(
        eq(installedExtensionsTable.projectId, projectId),
        eq(installedExtensionsTable.extensionId, extensionId)
      )
    )
    .limit(1);

  if (!result) return undefined;

  return {
    ...result.installed,
    extension: result.extension,
  } as any;
}

export async function updateInstalledExtensionConfig(
  projectId: string,
  extensionId: string,
  configuration: Record<string, any>
): Promise<InstalledExtension | undefined> {
  const [updated] = await db
    .update(installedExtensionsTable)
    .set({
      configuration,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(installedExtensionsTable.projectId, projectId),
        eq(installedExtensionsTable.extensionId, extensionId)
      )
    )
    .returning();

  return updated;
}

export async function toggleExtensionStatus(
  projectId: string,
  extensionId: string,
  enabled: boolean
): Promise<InstalledExtension | undefined> {
  const [updated] = await db
    .update(installedExtensionsTable)
    .set({
      enabled,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(installedExtensionsTable.projectId, projectId),
        eq(installedExtensionsTable.extensionId, extensionId)
      )
    )
    .returning();

  return updated;
}

export async function getMarketplaceStats() {
  const allExtensions = await db.select().from(extensionsTable);
  const totalDownloads = allExtensions.reduce(
    (sum, ext) => sum + ext.downloadCount,
    0
  );
  const avgRating =
    allExtensions.reduce((sum, ext) => sum + parseFloat((ext.rating ?? 0).toString()), 0) /
    Math.max(allExtensions.length, 1);

  const categories = new Set(allExtensions.map((ext) => ext.category));

  return {
    totalExtensions: allExtensions.length,
    publishedExtensions: allExtensions.filter((e) => e.isPublished).length,
    verifiedExtensions: allExtensions.filter((e) => e.isVerified).length,
    totalDownloads,
    avgRating: avgRating.toFixed(2),
    categories: Array.from(categories),
  };
}
