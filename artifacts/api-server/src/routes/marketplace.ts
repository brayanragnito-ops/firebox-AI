import { Router, type Response } from "express";
import { z } from "zod";
import { type AuthenticatedRequest } from "../middlewares/auth";
import {
  createExtension,
  getExtensionById,
  getExtensionByName,
  searchExtensions,
  getFeaturedExtensions,
  getExtensionsByCategory,
  getPopularExtensions,
  getTopRatedExtensions,
  updateExtensionRating,
  updateExtension,
  deleteExtension,
  installExtension,
  uninstallExtension,
  getInstalledExtensions,
  getInstalledExtensionDetails,
  updateInstalledExtensionConfig,
  toggleExtensionStatus,
  getMarketplaceStats,
} from "../services/marketplace";
import { getProjectByUserAndId } from "../services/db";
import { authMiddleware, optionalAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const marketplaceRouter = Router();

// Marketplace Browse Endpoints (Public)

// GET /api/marketplace/extensions - Search extensions
marketplaceRouter.get("/marketplace/extensions", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = Array.isArray(req.query.query) ? req.query.query[0] : req.query.query;
    const category = Array.isArray(req.query.category) ? req.query.category[0] : req.query.category;
    const limit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit ?? "50";

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);

    let extensions;
    if (query) {
      extensions = await searchExtensions(query as string, category as string, limitNum);
    } else if (category) {
      extensions = await getExtensionsByCategory(category as string, limitNum);
    } else {
      extensions = await getPopularExtensions(limitNum);
    }

    res.json({
      extensions,
      count: extensions.length,
      query,
      category,
    });
  } catch (error) {
    logger.error({ err: error as any }, "Error searching extensions");
    res.status(500).json({ error: "Failed to search extensions" });
  }
});

// GET /api/marketplace/featured - Get featured extensions
marketplaceRouter.get("/marketplace/featured", optionalAuth, async (req: Request, res: Response) => {
  try {
    const extensions = await getFeaturedExtensions();
    res.json({ extensions, count: extensions.length });
  } catch (error) {
    logger.error({ err: error as any }, "Error fetching featured extensions");
    res.status(500).json({ error: "Failed to fetch featured extensions" });
  }
});

// GET /api/marketplace/extensions/:extensionId - Get extension details
marketplaceRouter.get(
  "/marketplace/extensions/:extensionId",
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const { extensionId } = req.params;

      const extension = await getExtensionById(extensionId as string);
      if (!extension) {
        return res.status(404).json({ error: "Extension not found" });
      }

      res.json(extension);
    } catch (error) {
      logger.error({ err: error as any }, "Error fetching extension");
      res.status(500).json({ error: "Failed to fetch extension" });
    }
  }
);

// GET /api/marketplace/categories/:category - Get extensions by category
marketplaceRouter.get(
  "/marketplace/categories/:category",
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const category = String(req.params.category);
      const limit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit ?? "50";

      const limitNum = Math.min(parseInt(limit as string) || 50, 100);
      const extensions = await getExtensionsByCategory(category as string, limitNum);

      res.json({ extensions, count: extensions.length, category });
    } catch (error) {
      logger.error({ err: error as any }, "Error fetching category extensions");
      res.status(500).json({ error: "Failed to fetch extensions" });
    }
  }
);

// GET /api/marketplace/stats - Get marketplace statistics
marketplaceRouter.get("/marketplace/stats", optionalAuth, async (req: Request, res: Response) => {
  try {
    const stats = await getMarketplaceStats();
    res.json(stats);
  } catch (error) {
    logger.error({ err: error as any }, "Error fetching marketplace stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Extension Publishing (Admin)

// POST /api/marketplace/extensions - Create/publish extension
marketplaceRouter.post(
  "/marketplace/extensions",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        name,
        displayName,
        description,
        longDescription,
        category,
        version,
        author,
        authorEmail,
        license,
        icon,
        tags,
        code,
        configuration,
        dependencies,
        compatibleFrameworks,
      } = req.body;

      // Validate input
      const schema = z.object({
        name: z.string().min(3),
        displayName: z.string().min(3),
        description: z.string().min(10),
        longDescription: z.string().optional(),
        category: z.enum([
          "code-generation",
          "documentation",
          "testing",
          "deployment",
          "monitoring",
          "security",
          "performance",
          "styling",
          "utilities",
        ]),
        version: z.string().default("1.0.0"),
        author: z.string(),
        authorEmail: z.string().email().optional(),
        license: z.string().default("MIT"),
        icon: z.string().url().optional(),
        tags: z.array(z.string()).default([]),
        code: z.string(),
        configuration: z.record(z.any()).optional(),
        dependencies: z.record(z.string()).optional(),
        compatibleFrameworks: z.array(z.string()).optional(),
      });

      const validated = schema.parse({
        name,
        displayName,
        description,
        longDescription,
        category,
        version,
        author,
        authorEmail,
        license,
        icon,
        tags,
        code,
        configuration,
        dependencies,
        compatibleFrameworks,
      });

      const extension = await createExtension(validated);
      res.status(201).json(extension);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      logger.error({ err: error as any }, "Error creating extension");
      res.status(500).json({ error: "Failed to create extension" });
    }
  }
);

// PUT /api/marketplace/extensions/:extensionId - Update extension
marketplaceRouter.put(
  "/marketplace/extensions/:extensionId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const extensionId = String(req.params.extensionId);
      const updates = req.body;

      const extension = await updateExtension(extensionId as string, updates);
      if (!extension) {
        return res.status(404).json({ error: "Extension not found" });
      }

      res.json(extension);
    } catch (error) {
      logger.error({ err: error as any }, "Error updating extension");
      res.status(500).json({ error: "Failed to update extension" });
    }
  }
);

// PUT /api/marketplace/extensions/:extensionId/rate - Rate extension
marketplaceRouter.put(
  "/marketplace/extensions/:extensionId/rate",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const extensionId = String(req.params.extensionId);
      const { rating } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      const extension = await updateExtensionRating(extensionId as string, rating);
      if (!extension) {
        return res.status(404).json({ error: "Extension not found" });
      }

      res.json(extension);
    } catch (error) {
      logger.error({ err: error as any }, "Error rating extension");
      res.status(500).json({ error: "Failed to rate extension" });
    }
  }
);

// Project Extension Installation

// GET /api/projects/:projectId/extensions - Get installed extensions
marketplaceRouter.get(
  "/projects/:projectId/extensions",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const userId = req.user?.id as string;

      // Verify project ownership
      await getProjectByUserAndId(userId, projectId);

      const extensions = await getInstalledExtensions(projectId as string);
      res.json({ extensions, count: extensions.length });
    } catch (error) {
      logger.error({ err: error as any }, "Error fetching installed extensions");
      res.status(500).json({ error: "Failed to fetch installed extensions" });
    }
  }
);

// POST /api/projects/:projectId/extensions/:extensionId/install - Install extension
marketplaceRouter.post(
  "/projects/:projectId/extensions/:extensionId/install",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { projectId, extensionId } = req.params;
      const { configuration } = req.body;
      const userId = req.user?.id as string;

      // Verify project ownership
      await getProjectByUserAndId(userId, projectId);

      // Verify extension exists
      const extension = await getExtensionById(extensionId as string);
      if (!extension) {
        return res.status(404).json({ error: "Extension not found" });
      }

      const installed = await installExtension({
        projectId: projectId as string,
        extensionId: extensionId as string,
        configuration: configuration || extension.configuration,
        version: extension.version,
      });

      res.status(201).json(installed);
    } catch (error) {
      logger.error({ err: error as any }, "Error installing extension");
      res.status(500).json({ error: "Failed to install extension" });
    }
  }
);

// DELETE /api/projects/:projectId/extensions/:extensionId - Uninstall extension
marketplaceRouter.delete(
  "/projects/:projectId/extensions/:extensionId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const extensionId = String(req.params.extensionId);
      const userId = req.user?.id as string;

      // Verify project ownership
      await getProjectByUserAndId(userId, projectId);

      await uninstallExtension(projectId as string, extensionId as string);
      res.json({ success: true });
    } catch (error) {
      logger.error({ err: error as any }, "Error uninstalling extension");
      res.status(500).json({ error: "Failed to uninstall extension" });
    }
  }
);

// PUT /api/projects/:projectId/extensions/:extensionId/config - Update extension config
marketplaceRouter.put(
  "/projects/:projectId/extensions/:extensionId/config",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { projectId, extensionId } = req.params;
      const { configuration } = req.body;
      const userId = req.user?.id as string;

      // Verify project ownership
      await getProjectByUserAndId(userId, projectId);

      const updated = await updateInstalledExtensionConfig(
        projectId as string,
        extensionId as string,
        configuration
      );

      if (!updated) {
        return res.status(404).json({ error: "Extension not installed" });
      }

      res.json(updated);
    } catch (error) {
      logger.error({ err: error as any }, "Error updating extension config");
      res.status(500).json({ error: "Failed to update configuration" });
    }
  }
);

// PUT /api/projects/:projectId/extensions/:extensionId/toggle - Toggle extension status
marketplaceRouter.put(
  "/projects/:projectId/extensions/:extensionId/toggle",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const extensionId = String(req.params.extensionId);
      const { enabled } = req.body;
      const userId = req.user?.id as string;

      // Verify project ownership
      await getProjectByUserAndId(userId, projectId);

      const updated = await toggleExtensionStatus(
        projectId as string,
        extensionId as string,
        enabled
      );

      if (!updated) {
        return res.status(404).json({ error: "Extension not installed" });
      }

      res.json(updated);
    } catch (error) {
      logger.error({ err: error as any }, "Error toggling extension");
      res.status(500).json({ error: "Failed to toggle extension" });
    }
  }
);

export default marketplaceRouter;
