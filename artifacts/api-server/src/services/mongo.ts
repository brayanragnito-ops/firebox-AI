import { MongoClient, type Collection } from "mongodb";

export type UserDocument = { _id: string; email: string; name: string; passwordHash: string; createdAt: Date };
export type ProjectDocument = { _id: string; userId: string; name: string; slug: string; source: "prompt" | "github" | "zip"; framework: string; runtime: string; status: "ready" | "running" | "needs-setup" | "deploying"; updatedAt: Date; color: string; description: string | null; repository: string | null };
export type ActivityDocument = { _id: string; userId: string; projectId: string; label: string; detail: string | null; status: "complete" | "active" | "queued" | "failed"; timestamp: Date };
export type DeploymentDocument = { _id: string; userId: string; projectId: string; projectName: string; provider: string; status: "live" | "building" | "failed" | "paused"; url: string | null; createdAt: Date };
export type AgentRunDocument = { _id: string; userId: string; projectId: string; agent: string; prompt: string; status: "queued" | "running" | "completed" | "failed" | "cancelled"; selectedBy: "user" | "auto" | "handoff"; tokensUsed: number; apiCalls: number; computeSeconds: number; error: string | null; startedAt: Date; completedAt: Date | null; createdAt: Date };
export type AgentEventDocument = { _id: string; runId: string; userId: string; projectId: string; kind: "agent" | "tool" | "handoff" | "terminal" | "system"; status: "queued" | "active" | "complete" | "failed"; label: string; detail: string | null; tool: string | null; metadata: Record<string, unknown>; createdAt: Date };
export type UsageDocument = { _id: string; userId: string; date: string; agentRunTokens: number; computeMinutes: number; apiCalls: number; costUSD: string; createdAt: Date; updatedAt: Date };

let client: MongoClient | undefined;
async function database() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");
  client ??= new MongoClient(uri);
  await client.connect();
  return client.db();
}

export const users = async (): Promise<Collection<UserDocument>> => (await database()).collection("users");
export const projects = async (): Promise<Collection<ProjectDocument>> => (await database()).collection("projects");
export const activities = async (): Promise<Collection<ActivityDocument>> => (await database()).collection("activities");
export const deployments = async (): Promise<Collection<DeploymentDocument>> => (await database()).collection("deployments");
export const agentRuns = async (): Promise<Collection<AgentRunDocument>> => (await database()).collection("agent_runs");
export const agentEvents = async (): Promise<Collection<AgentEventDocument>> => (await database()).collection("agent_events");
export const usage = async (): Promise<Collection<UsageDocument>> => (await database()).collection("usage");
