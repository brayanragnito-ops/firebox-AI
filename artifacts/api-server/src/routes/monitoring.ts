import { Router, type Response } from "express";
import { type AuthenticatedRequest, authMiddleware, assertAuthenticated } from "../middlewares/auth";
import { getProjectByUserAndId } from "../services/db";
import {
  logDeploymentEvent,
  getDeploymentLogs,
  getProjectLogs,
  recordMetric,
  getDeploymentMetrics,
  getLatestMetric,
  getAverageMetrics,
  trackError,
  getDeploymentErrors,
  getProjectErrors,
  resolveError,
  generateHealthReport,
} from "../services/monitoring";
import { logger } from "../lib/logger";

const router = Router();

/**
 * GET /api/projects/:projectId/monitoring/health
 * Get deployment health report
 */
router.get(
  "/projects/:projectId/monitoring/health/:deploymentId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = assertAuthenticated(req);
      const { projectId, deploymentId } = req.params;

      // Verify project belongs to user
      const project = await getProjectByUserAndId(userId, projectId as string);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      const health = await generateHealthReport(deploymentId as string);
      res.json({ health });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get health report";
      logger.error({ err: error as any }, "Health report error");
      res.status(400).json({ error: message });
    }
  }
);

/**
 * GET /api/projects/:projectId/monitoring/logs
 * Get project deployment logs
 */
router.get("/projects/:projectId/monitoring/logs", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const { projectId } = req.params;
    const { limit } = req.query;

    // Verify project belongs to user
    const project = await getProjectByUserAndId(userId, projectId as string);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const logs = await getProjectLogs(projectId as string, parseInt(limit as string) || 200);
    res.json({ logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get logs";
    logger.error({ err: error as any }, "Get logs error");
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/projects/:projectId/monitoring/logs/:deploymentId
 * Get deployment-specific logs
 */
router.get(
  "/projects/:projectId/monitoring/logs/:deploymentId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = assertAuthenticated(req);
      const { projectId, deploymentId } = req.params;
      const { limit } = req.query;

      // Verify project belongs to user
      const project = await getProjectByUserAndId(userId, projectId as string);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      const logs = await getDeploymentLogs(deploymentId as string, parseInt(limit as string) || 100);
      res.json({ logs });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get deployment logs";
      logger.error({ err: error as any }, "Get deployment logs error");
      res.status(400).json({ error: message });
    }
  }
);

/**
 * POST /api/projects/:projectId/monitoring/logs
 * Log deployment event
 */
router.post(
  "/projects/:projectId/monitoring/logs",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = assertAuthenticated(req);
      const { projectId } = req.params;
      const { deploymentId, level, message } = req.body;

      // Verify project belongs to user
      const project = await getProjectByUserAndId(userId, projectId as string);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      const log = await logDeploymentEvent({
        deploymentId,
        projectId,
        level: level || "info",
        message,
      });

      res.status(201).json({ log });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to log event";
      logger.error({ err: error as any }, "Log event error");
      res.status(400).json({ error: message });
    }
  }
);

/**
 * GET /api/projects/:projectId/monitoring/metrics/:deploymentId
 * Get deployment metrics
 */
router.get(
  "/projects/:projectId/monitoring/metrics/:deploymentId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = assertAuthenticated(req);
      const { projectId, deploymentId } = req.params;
      const { hours } = req.query;

      // Verify project belongs to user
      const project = await getProjectByUserAndId(userId, projectId as string);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      const metrics = await getDeploymentMetrics(deploymentId as string, parseInt(hours as string) || 24);
      const latest = await getLatestMetric(deploymentId as string);
      const average = await getAverageMetrics(deploymentId as string, parseInt(hours as string) || 24);

      res.json({ metrics, latest, average });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get metrics";
      logger.error({ err: error as any }, "Get metrics error");
      res.status(400).json({ error: message });
    }
  }
);

/**
 * POST /api/projects/:projectId/monitoring/metrics
 * Record performance metric
 */
router.post(
  "/projects/:projectId/monitoring/metrics",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = assertAuthenticated(req);
      const { projectId } = req.params;
      const { deploymentId, cpuUsage, memoryUsage, latency, requestsPerSecond, errorRate, uptime } = req.body;

      // Verify project belongs to user
      const project = await getProjectByUserAndId(userId, projectId as string);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      const metric = await recordMetric({
        deploymentId,
        projectId,
        cpuUsage,
        memoryUsage,
        latency,
        requestsPerSecond,
        errorRate,
        uptime,
      });

      res.status(201).json({ metric });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to record metric";
      logger.error({ err: error as any }, "Record metric error");
      res.status(400).json({ error: message });
    }
  }
);

/**
 * GET /api/projects/:projectId/monitoring/errors
 * Get project errors
 */
router.get(
  "/projects/:projectId/monitoring/errors",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = assertAuthenticated(req);
      const { projectId } = req.params;
      const { unresolved } = req.query;

      // Verify project belongs to user
      const project = await getProjectByUserAndId(userId, projectId as string);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      const errors = await getProjectErrors(projectId as string, unresolved === "true");
      res.json({ errors });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get errors";
      logger.error({ err: error as any }, "Get errors error");
      res.status(400).json({ error: message });
    }
  }
);

/**
 * POST /api/projects/:projectId/monitoring/errors
 * Track error
 */
router.post(
  "/projects/:projectId/monitoring/errors",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = assertAuthenticated(req);
      const { projectId } = req.params;
      const { deploymentId, errorType, message: errorMessage, stackTrace } = req.body;

      // Verify project belongs to user
      const project = await getProjectByUserAndId(userId, projectId as string);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      const error = await trackError({
        deploymentId,
        projectId,
        errorType,
        message: errorMessage,
        stackTrace,
        count: 1,
        resolved: "false",
      });

      res.status(201).json({ error });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to track error";
      logger.error({ err: error as any }, "Track error error");
      res.status(400).json({ error: message });
    }
  }
);

/**
 * PUT /api/projects/:projectId/monitoring/errors/:errorId/resolve
 * Resolve error
 */
router.put(
  "/projects/:projectId/monitoring/errors/:errorId/resolve",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = assertAuthenticated(req);
      const { projectId, errorId } = req.params;

      // Verify project belongs to user
      const project = await getProjectByUserAndId(userId, projectId as string);
      if (!project) {
        res.status(404).json({ error: "Project not found" });
        return;
      }

      const resolved = await resolveError(errorId as string);
      res.json({ error: resolved });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to resolve error";
      logger.error({ err: error as any }, "Resolve error error");
      res.status(400).json({ error: message });
    }
  }
);

export default router;
