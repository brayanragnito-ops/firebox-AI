import { db, cicdRunsTable, githubWebhooksTable, projectsTable } from "@workspace/db";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import type { CicdRun, InsertCicdRun, GithubWebhook, InsertGithubWebhook } from "@workspace/db";
import crypto from "crypto";

// CICD Runs Management

export async function createCicdRun(run: InsertCicdRun): Promise<CicdRun> {
  const [created] = await db.insert(cicdRunsTable).values(run).returning();
  return created;
}

export async function getCicdRunsByProjectId(
  projectId: string,
  limitCount: number = 50
): Promise<CicdRun[]> {
  return await db
    .select()
    .from(cicdRunsTable)
    .where(eq(cicdRunsTable.projectId, projectId))
    .orderBy(desc(cicdRunsTable.createdAt))
    .limit(limitCount);
}

export async function getCicdRunById(runId: string): Promise<CicdRun | undefined> {
  const [run] = await db
    .select()
    .from(cicdRunsTable)
    .where(eq(cicdRunsTable.id, runId))
    .limit(1);
  return run;
}

export async function updateCicdRunStatus(
  runId: string,
  status: string,
  conclusion?: string,
  logs?: string
): Promise<CicdRun | undefined> {
  const updates: any = {
    status,
    updatedAt: new Date(),
  };
  if (conclusion) updates.conclusion = conclusion;
  if (logs) updates.logs = logs;
  if (conclusion === "success" || conclusion === "failure") {
    updates.completedAt = new Date();
    updates.durationSeconds = Math.floor(
      (new Date().getTime() - new Date().getTime()) / 1000
    );
  }

  const [updated] = await db
    .update(cicdRunsTable)
    .set(updates)
    .where(eq(cicdRunsTable.id, runId))
    .returning();
  return updated;
}

export async function getCicdRunStatistics(projectId: string) {
  const runs = await db
    .select()
    .from(cicdRunsTable)
    .where(eq(cicdRunsTable.projectId, projectId))
    .orderBy(desc(cicdRunsTable.createdAt))
    .limit(100);

  const totalRuns = runs.length;
  const successfulRuns = runs.filter((r) => r.conclusion === "success").length;
  const failedRuns = runs.filter((r) => r.conclusion === "failure").length;
  const cancelledRuns = runs.filter((r) => r.conclusion === "cancelled").length;
  const avgDuration =
    runs.reduce((sum, r) => sum + (r.durationSeconds || 0), 0) / Math.max(totalRuns, 1);
  const successRate = (successfulRuns / Math.max(totalRuns, 1)) * 100;

  return {
    totalRuns,
    successfulRuns,
    failedRuns,
    cancelledRuns,
    avgDuration: Math.round(avgDuration),
    successRate: successRate.toFixed(1),
    lastRun: runs[0] || null,
  };
}

// GitHub Webhooks Management

export async function createGithubWebhook(
  webhook: InsertGithubWebhook
): Promise<GithubWebhook> {
  const [created] = await db.insert(githubWebhooksTable).values(webhook).returning();
  return created;
}

export async function getWebhooksByProjectId(projectId: string): Promise<GithubWebhook[]> {
  return await db
    .select()
    .from(githubWebhooksTable)
    .where(
      and(
        eq(githubWebhooksTable.projectId, projectId),
        eq(githubWebhooksTable.isActive, true)
      )
    )
    .orderBy(desc(githubWebhooksTable.createdAt));
}

export async function getWebhookById(webhookId: string): Promise<GithubWebhook | undefined> {
  const [webhook] = await db
    .select()
    .from(githubWebhooksTable)
    .where(eq(githubWebhooksTable.webhookId, webhookId))
    .limit(1);
  return webhook;
}

export async function updateWebhookStatus(
  webhookId: string,
  isActive: boolean,
  autoDeployEnabled?: boolean,
  deployBranches?: string[]
): Promise<GithubWebhook | undefined> {
  const updates: any = {
    isActive,
    updatedAt: new Date(),
  };
  if (autoDeployEnabled !== undefined) updates.autoDeployEnabled = autoDeployEnabled;
  if (deployBranches) updates.deployBranches = deployBranches;

  const [updated] = await db
    .update(githubWebhooksTable)
    .set(updates)
    .where(eq(githubWebhooksTable.webhookId, webhookId))
    .returning();
  return updated;
}

export async function incrementWebhookTriggerCount(
  webhookId: string,
  eventType: string
): Promise<void> {
  const webhook = await getWebhookById(webhookId);
  if (!webhook) return;

  const triggerCounts = (webhook.triggerCount as any) || {};
  triggerCounts[eventType] = (triggerCounts[eventType] || 0) + 1;

  await db
    .update(githubWebhooksTable)
    .set({
      triggerCount: triggerCounts,
      lastTriggeredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(githubWebhooksTable.webhookId, webhookId));
}

// Webhook Processing

export async function processGithubWebhookEvent(
  projectId: string,
  userId: string,
  eventType: string,
  payload: Record<string, any>
): Promise<CicdRun | null> {
  const normalizedEventType = eventType as
    | "push"
    | "pull_request"
    | "release"
    | "workflow_dispatch"
    | "workflow_run";

  const webhook = (
    await db
      .select()
      .from(githubWebhooksTable)
      .where(
        and(
          eq(githubWebhooksTable.projectId, projectId),
          eq(githubWebhooksTable.eventType, normalizedEventType)
        )
      )
      .limit(1)
  )[0];

  if (!webhook || !webhook.isActive) return null;

  // Increment trigger count
  await incrementWebhookTriggerCount(webhook.webhookId, eventType);

  // Check if auto-deploy is enabled and branch matches
  if (!webhook.autoDeployEnabled) return null;

  const branch = payload.ref?.replace("refs/heads/", "") || payload.branch || "main";
  const deployBranches = Array.isArray(webhook.deployBranches) ? webhook.deployBranches : [];
  if (deployBranches.length > 0 && !deployBranches.includes(branch)) {
    return null;
  }

  // Create CICD run
  const run = await createCicdRun({
    projectId,
    userId,
    workflowName: "Auto Deploy",
    workflowFile: ".github/workflows/deploy.yml",
    status: "pending",
    triggerEvent: eventType as "push" | "pull_request" | "release" | "workflow_dispatch" | "workflow_run" | "manual",
    branch,
    commitSha: payload.after || payload.pull_request?.head?.sha || "unknown",
    commitMessage: payload.head_commit?.message || "Auto deployment triggered",
    commitAuthor: payload.pusher?.name || payload.sender?.login || "automated",
    runNumber: Math.floor(Math.random() * 10000),
    environmentVariables: {},
    jobsCount: 1,
    successCount: 0,
    failureCount: 0,
  });

  return run;
}

// GitHub Actions Integration

export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function verifyGithubSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function triggerWorkflow(
  projectId: string,
  userId: string,
  workflowName: string,
  inputs?: Record<string, string>
): Promise<CicdRun> {
  const project = (
    await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .limit(1)
  )[0];

  if (!project) throw new Error("Project not found");

  // Create CICD run for manual trigger
  const run = await createCicdRun({
    projectId,
    userId,
    workflowName,
    workflowFile: `.github/workflows/${workflowName}.yml`,
    status: "pending",
    triggerEvent: "manual",
    branch: "main",
    commitSha: "manual-trigger",
    commitMessage: `Manual workflow trigger: ${workflowName}`,
    commitAuthor: "manual",
    runNumber: Math.floor(Math.random() * 10000),
    environmentVariables: inputs || {},
    jobsCount: 1,
    successCount: 0,
    failureCount: 0,
  });

  // Simulate async job processing
  setTimeout(() => {
    updateCicdRunStatus(run.id, "running");
  }, 500);

  return run;
}

export async function getRecentCicdRuns(
  projectId: string,
  hoursBack: number = 24
): Promise<CicdRun[]> {
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  return await db
    .select()
    .from(cicdRunsTable)
    .where(
      and(
        eq(cicdRunsTable.projectId, projectId),
        gte(cicdRunsTable.createdAt, cutoffTime)
      )
    )
    .orderBy(desc(cicdRunsTable.createdAt))
    .limit(100);
}

export async function getCicdRunsByBranch(
  projectId: string,
  branch: string
): Promise<CicdRun[]> {
  return await db
    .select()
    .from(cicdRunsTable)
    .where(
      and(
        eq(cicdRunsTable.projectId, projectId),
        eq(cicdRunsTable.branch, branch)
      )
    )
    .orderBy(desc(cicdRunsTable.createdAt))
    .limit(50);
}
