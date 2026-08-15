import {
  deploymentLogsTable,
  performanceMetricsTable,
  errorTrackingTable,
  type InsertDeploymentLog,
  type InsertPerformanceMetric,
  type InsertErrorTracking,
} from "@workspace/db";
import { db } from "@workspace/db";
import { eq, and, gt, desc } from "drizzle-orm";

/**
 * Log deployment event
 */
export async function logDeploymentEvent(log: InsertDeploymentLog) {
  const result = await db.insert(deploymentLogsTable).values(log).returning();
  return result[0];
}

/**
 * Get deployment logs
 */
export async function getDeploymentLogs(deploymentId: string, limitCount: number = 100) {
  return await db
    .select()
    .from(deploymentLogsTable)
    .where(eq(deploymentLogsTable.deploymentId, deploymentId))
    .orderBy(desc(deploymentLogsTable.timestamp))
    .limit(limitCount);
}

/**
 * Get project logs (all deployments)
 */
export async function getProjectLogs(projectId: string, limitCount: number = 200) {
  return await db
    .select()
    .from(deploymentLogsTable)
    .where(eq(deploymentLogsTable.projectId, projectId))
    .orderBy(desc(deploymentLogsTable.timestamp))
    .limit(limitCount);
}

/**
 * Record performance metric
 */
export async function recordMetric(metric: InsertPerformanceMetric) {
  const result = await db.insert(performanceMetricsTable).values(metric).returning();
  return result[0];
}

/**
 * Get performance metrics for deployment
 */
export async function getDeploymentMetrics(deploymentId: string, hoursBack: number = 24) {
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  return await db
    .select()
    .from(performanceMetricsTable)
    .where(
      and(
        eq(performanceMetricsTable.deploymentId, deploymentId),
        gt(performanceMetricsTable.timestamp, cutoffTime)
      )
    )
    .orderBy(desc(performanceMetricsTable.timestamp))
    .limit(1000);
}

/**
 * Get latest metric for deployment
 */
export async function getLatestMetric(deploymentId: string) {
  const result = await db
    .select()
    .from(performanceMetricsTable)
    .where(eq(performanceMetricsTable.deploymentId, deploymentId))
    .orderBy(desc(performanceMetricsTable.timestamp))
    .limit(1);
  return result[0] || null;
}

/**
 * Calculate average metrics for time period
 */
export async function getAverageMetrics(deploymentId: string, hoursBack: number = 24) {
  const metrics = await getDeploymentMetrics(deploymentId, hoursBack);
  
  if (metrics.length === 0) {
    return null;
  }

  const avgCpu =
    metrics.reduce((sum, m) => sum + (parseFloat(m.cpuUsage as any) || 0), 0) /
    metrics.length;
  const avgMemory =
    metrics.reduce((sum, m) => sum + (parseFloat(m.memoryUsage as any) || 0), 0) /
    metrics.length;
  const avgLatency =
    metrics.reduce((sum, m) => sum + (parseFloat(m.latency as any) || 0), 0) /
    metrics.length;
  const avgRps =
    metrics.reduce((sum, m) => sum + (parseFloat(m.requestsPerSecond as any) || 0), 0) /
    metrics.length;
  const avgErrorRate =
    metrics.reduce((sum, m) => sum + (parseFloat(m.errorRate as any) || 0), 0) /
    metrics.length;
  const avgUptime =
    metrics.reduce((sum, m) => sum + (parseFloat(m.uptime as any) || 0), 0) /
    metrics.length;

  return {
    cpuUsage: avgCpu,
    memoryUsage: avgMemory,
    latency: avgLatency,
    requestsPerSecond: avgRps,
    errorRate: avgErrorRate,
    uptime: avgUptime,
  };
}

/**
 * Track error
 */
export async function trackError(error: InsertErrorTracking) {
  const result = await db.insert(errorTrackingTable).values(error).returning();
  return result[0];
}

/**
 * Get errors for deployment
 */
export async function getDeploymentErrors(deploymentId: string, unresolvedOnly: boolean = false) {
  let query = db
    .select()
    .from(errorTrackingTable)
    .where(eq(errorTrackingTable.deploymentId, deploymentId));

  if (unresolvedOnly) {
    query = db
      .select()
      .from(errorTrackingTable)
      .where(
        and(
          eq(errorTrackingTable.deploymentId, deploymentId),
          eq(errorTrackingTable.resolved, "false")
        )
      );
  }

  return await query.orderBy(desc(errorTrackingTable.lastOccurred));
}

/**
 * Get project errors
 */
export async function getProjectErrors(projectId: string, unresolvedOnly: boolean = false) {
  let query = db
    .select()
    .from(errorTrackingTable)
    .where(eq(errorTrackingTable.projectId, projectId));

  if (unresolvedOnly) {
    query = db
      .select()
      .from(errorTrackingTable)
      .where(
        and(
          eq(errorTrackingTable.projectId, projectId),
          eq(errorTrackingTable.resolved, "false")
        )
      );
  }

  return await query.orderBy(desc(errorTrackingTable.count));
}

/**
 * Mark error as resolved
 */
export async function resolveError(errorId: string) {
  const result = await db
    .update(errorTrackingTable)
    .set({ resolved: "true" })
    .where(eq(errorTrackingTable.id, errorId))
    .returning();
  return result[0] || null;
}

/**
 * Generate health report
 */
export async function generateHealthReport(deploymentId: string) {
  const latestMetric = await getLatestMetric(deploymentId);
  const averageMetrics = await getAverageMetrics(deploymentId, 24);
  const errors = await getDeploymentErrors(deploymentId, true);

  const health = {
    status:
      (latestMetric?.uptime && parseFloat(latestMetric.uptime as any) > 95) ||
      (averageMetrics && averageMetrics.uptime > 95)
        ? "healthy"
        : "degraded",
    uptime: latestMetric?.uptime
      ? parseFloat(latestMetric.uptime as any)
      : averageMetrics?.uptime || 0,
    errorCount: errors.length,
    lastCheck: latestMetric?.timestamp || new Date(),
    latestMetric,
    averageMetrics,
    unresolvedErrors: errors,
  };

  return health;
}
