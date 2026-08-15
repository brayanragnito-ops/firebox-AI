import { Router, type Response } from "express";
import { z } from "zod";
import { type AuthenticatedRequest } from "../middlewares/auth";
import {
  createCicdRun,
  getCicdRunsByProjectId,
  getCicdRunById,
  updateCicdRunStatus,
  getCicdRunStatistics,
  getWebhooksByProjectId,
  createGithubWebhook,
  updateWebhookStatus,
  processGithubWebhookEvent,
  triggerWorkflow,
  getRecentCicdRuns,
  getCicdRunsByBranch,
  generateWebhookSecret,
  verifyGithubSignature,
} from "../services/cicd";
import { getProjectByUserAndId } from "../services/db";
import { authMiddleware, optionalAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const cicdRouter = Router();

// CICD Runs Endpoints

// GET /api/projects/:projectId/cicd/runs - Get all CICD runs for project
cicdRouter.get("/projects/:projectId/cicd/runs", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = String(req.params.projectId);
    const userId = req.user?.id as string;

    // Verify project ownership
    await getProjectByUserAndId(userId, projectId);

    const runs = await getCicdRunsByProjectId(projectId as string);
    res.json({ runs, count: runs.length });
  } catch (error) {
    logger.error({ err: error as any }, "Error fetching CICD runs");
    res.status(500).json({ error: "Failed to fetch CICD runs" });
  }
});

// GET /api/projects/:projectId/cicd/runs/:runId - Get specific run
cicdRouter.get(
  "/projects/:projectId/cicd/runs/:runId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const runId = String(req.params.runId);
      const userId = req.user?.id as string;

      // Verify project ownership
      await getProjectByUserAndId(userId, projectId);

      const run = await getCicdRunById(runId as string);
      if (!run) {
        return res.status(404).json({ error: "Run not found" });
      }

      res.json(run);
    } catch (error) {
      logger.error({ err: error as any }, "Error fetching CICD run");
      res.status(500).json({ error: "Failed to fetch CICD run" });
    }
  }
);

// POST /api/projects/:projectId/cicd/trigger - Manually trigger workflow
cicdRouter.post(
  "/projects/:projectId/cicd/trigger",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const { workflowName, inputs } = req.body;
      const userId = req.user?.id as string;

      // Validate project ownership
      await getProjectByUserAndId(userId, projectId);

      // Validate input
      if (!workflowName) {
        return res.status(400).json({ error: "workflowName is required" });
      }

      const run = await triggerWorkflow(projectId as string, userId, workflowName, inputs || {});
      res.status(201).json(run);
    } catch (error) {
      logger.error({ err: error as any }, "Error triggering workflow");
      res.status(500).json({ error: "Failed to trigger workflow" });
    }
  }
);

// GET /api/projects/:projectId/cicd/stats - Get CICD statistics
cicdRouter.get(
  "/projects/:projectId/cicd/stats",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const userId = req.user?.id as string;

      // Verify project ownership
      await getProjectByUserAndId(userId, projectId);

      const stats = await getCicdRunStatistics(projectId as string);
      res.json(stats);
    } catch (error) {
      logger.error({ err: error as any }, "Error fetching CICD statistics");
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  }
);

// GET /api/projects/:projectId/cicd/runs/branch/:branch - Get runs for branch
cicdRouter.get(
  "/projects/:projectId/cicd/runs/branch/:branch",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const branch = String(req.params.branch);
      const userId = req.user?.id as string;

      // Verify project ownership
      await getProjectByUserAndId(userId, projectId);

      const runs = await getCicdRunsByBranch(projectId as string, branch as string);
      res.json({ runs, count: runs.length });
    } catch (error) {
      logger.error({ err: error as any }, "Error fetching branch runs");
      res.status(500).json({ error: "Failed to fetch branch runs" });
    }
  }
);

// GitHub Webhooks Endpoints

// GET /api/projects/:projectId/webhooks - List project webhooks
cicdRouter.get(
  "/projects/:projectId/webhooks",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const userId = req.user?.id as string;

      // Verify project ownership
      await getProjectByUserAndId(userId, projectId);

      const webhooks = await getWebhooksByProjectId(projectId as string);
      res.json({ webhooks, count: webhooks.length });
    } catch (error) {
      logger.error({ err: error as any }, "Error fetching webhooks");
      res.status(500).json({ error: "Failed to fetch webhooks" });
    }
  }
);

// POST /api/projects/:projectId/webhooks - Create webhook
cicdRouter.post(
  "/projects/:projectId/webhooks",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const { eventType, repository, autoDeployEnabled, deployBranches } = req.body;
      const userId = req.user?.id as string;

      // Verify project ownership
      await getProjectByUserAndId(userId, projectId);

      // Validate input
      const schema = z.object({
        eventType: z.enum(["push", "pull_request", "release", "workflow_dispatch"]),
        repository: z.string(),
        autoDeployEnabled: z.boolean().optional(),
        deployBranches: z.array(z.string()).optional(),
      });

      const validated = schema.parse({ eventType, repository, autoDeployEnabled, deployBranches });

      const webhook = await createGithubWebhook({
        projectId: projectId as string,
        userId,
        webhookId: generateWebhookSecret(),
        eventType: validated.eventType,
        repository: validated.repository,
        isActive: true,
        autoDeployEnabled: validated.autoDeployEnabled || false,
        deployBranches: validated.deployBranches || [],
      });

      res.status(201).json(webhook);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      logger.error({ err: error as any }, "Error creating webhook");
      res.status(500).json({ error: "Failed to create webhook" });
    }
  }
);

// PUT /api/projects/:projectId/webhooks/:webhookId - Update webhook
cicdRouter.put(
  "/projects/:projectId/webhooks/:webhookId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const webhookId = String(req.params.webhookId);
      const { isActive, autoDeployEnabled, deployBranches } = req.body;
      const userId = req.user?.id as string;

      // Verify project ownership
      await getProjectByUserAndId(userId, projectId);

      const updated = await updateWebhookStatus(
        webhookId as string,
        isActive,
        autoDeployEnabled,
        deployBranches
      );

      if (!updated) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      res.json(updated);
    } catch (error) {
      logger.error({ err: error as any }, "Error updating webhook");
      res.status(500).json({ error: "Failed to update webhook" });
    }
  }
);

// POST /api/webhooks/github - GitHub webhook receiver (public endpoint)
cicdRouter.post("/webhooks/github", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const signature = req.headers["x-hub-signature-256"] as string;
    const eventType = req.headers["x-github-event"] as string;
    const payload = req.body;

    if (!eventType) {
      return res.status(400).json({ error: "Missing GitHub event type" });
    }

    // In production, verify signature with webhook secret
    // For now, we'll log the event and process it
    logger.info({ eventType, repository: payload.repository?.full_name }, "GitHub webhook received");

    // For demonstration, we'll auto-detect the project and user
    // In production, you'd match against registered webhooks
    if (payload.repository?.full_name && payload.pusher?.name) {
      // This would normally match against registered webhooks
      // For now, just acknowledge receipt
      res.json({ status: "received", event: eventType });
    } else {
      res.json({ status: "received", event: eventType });
    }
  } catch (error) {
    logger.error({ err: error as any }, "Error processing GitHub webhook");
    res.status(500).json({ error: "Failed to process webhook" });
  }
});

export default cicdRouter;
