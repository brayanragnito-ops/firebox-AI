import { randomUUID } from "node:crypto";
import { agentEvents, agentRuns, type AgentEventDocument, type AgentRunDocument } from "./mongo";
import type { AgentEvent, AgentId, AgentRun, CreateAgentRunInput, ToolName } from "../agents/contracts";

function toRun(document: AgentRunDocument): AgentRun {
  return { id: document._id, userId: document.userId, projectId: document.projectId, agent: document.agent as AgentId, prompt: document.prompt, status: document.status, selectedBy: document.selectedBy, tokensUsed: document.tokensUsed, apiCalls: document.apiCalls, computeSeconds: document.computeSeconds, error: document.error, startedAt: document.startedAt.toISOString(), completedAt: document.completedAt?.toISOString() ?? null, createdAt: document.createdAt.toISOString() };
}

function toEvent(document: AgentEventDocument): AgentEvent {
  return { id: document._id, runId: document.runId, projectId: document.projectId, userId: document.userId, kind: document.kind, status: document.status, label: document.label, detail: document.detail, tool: document.tool as ToolName | null, metadata: document.metadata, createdAt: document.createdAt.toISOString() };
}

export async function createAgentRun(input: CreateAgentRunInput): Promise<AgentRun> {
  const now = new Date();
  const document: AgentRunDocument = { _id: randomUUID(), userId: input.userId, projectId: input.projectId, agent: input.agent, prompt: input.prompt, status: "running", selectedBy: input.selectedBy, tokensUsed: 0, apiCalls: 0, computeSeconds: 0, error: null, startedAt: now, completedAt: null, createdAt: now };
  await (await agentRuns()).insertOne(document);
  return toRun(document);
}

export async function updateAgentRun(runId: string, userId: string, patch: Partial<Pick<AgentRunDocument, "status" | "tokensUsed" | "apiCalls" | "computeSeconds" | "error" | "completedAt">>): Promise<AgentRun | null> {
  const collection = await agentRuns();
  const result = await collection.findOneAndUpdate({ _id: runId, userId }, { $set: patch }, { returnDocument: "after" });
  return result ? toRun(result) : null;
}

export async function appendAgentEvent(input: Omit<AgentEvent, "id" | "createdAt">): Promise<AgentEvent> {
  const document: AgentEventDocument = { _id: randomUUID(), runId: input.runId, projectId: input.projectId, userId: input.userId, kind: input.kind, status: input.status, label: input.label, detail: input.detail, tool: input.tool, metadata: input.metadata, createdAt: new Date() };
  await (await agentEvents()).insertOne(document);
  return toEvent(document);
}

export async function getAgentRun(runId: string, userId: string): Promise<AgentRun | null> {
  const document = await (await agentRuns()).findOne({ _id: runId, userId });
  return document ? toRun(document) : null;
}

export async function listAgentRuns(projectId: string, userId: string): Promise<AgentRun[]> {
  const documents = await (await agentRuns()).find({ projectId, userId }).sort({ createdAt: -1 }).limit(50).toArray();
  return documents.map(toRun);
}

export async function listAgentEvents(projectId: string, userId: string): Promise<AgentEvent[]> {
  const documents = await (await agentEvents()).find({ projectId, userId }).sort({ createdAt: -1 }).limit(200).toArray();
  return documents.map(toEvent);
}
