import { randomUUID } from "node:crypto";
import { Router } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/auth";
import { agentCatalog, buildAgentContext, createProjectTools, getProviderStatus, providerFor, type ActivityEvent, type AgentId } from "../agents/runtime";
import { projects } from "../services/mongo";

const router = Router();
const runs = new Map<string, { id: string; projectId: string; userId: string; agent: AgentId; prompt: string; status: "running" | "completed" | "failed"; activities: ActivityEvent[]; tokensUsed: number; error?: string }>();
const validAgents = new Set(Object.keys(agentCatalog));
const event = (label: string, detail: string | null, status: ActivityEvent["status"]): ActivityEvent => ({ id: randomUUID(), label, detail, status, timestamp: new Date().toISOString() });

router.get("/agents", authMiddleware, (_req, res) => {
  const providers = getProviderStatus() as Record<string, { configured: boolean; variable: string; model: string | null }>;
  res.json(Object.entries(agentCatalog).map(([id, agent]) => ({ id, provider: agent.provider, role: agent.role, description: agent.description, configured: providers[agent.provider].configured, model: providers[agent.provider].model, available: providers[agent.provider].configured && Boolean(process.env[agent.modelVariable]) })));
});

router.get("/projects/:projectId/agent-runs/:runId", authMiddleware, (req: AuthenticatedRequest, res) => {
  const projectId = String(req.params.projectId);
  const runId = String(req.params.runId);
  const run = runs.get(runId);
  if (!run || run.projectId !== projectId || run.userId !== req.user!.id) {
    res.status(404).json({ error: "Agent run not found" });
    return;
  }
  res.json(run);
});

router.get("/projects/:projectId/activity", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const projectId = String(req.params.projectId);
  const requested = [...runs.values()].filter((run) => run.projectId === projectId && run.userId === req.user!.id).flatMap((run) => run.activities).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  res.json(requested);
});

router.post("/projects/:projectId/agent-runs", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const projectId = String(req.params.projectId);
  const project = await (await projects()).findOne({ _id: projectId, userId: req.user!.id });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  const requestedAgent = typeof req.body?.agent === "string" ? req.body.agent : "auto";
  if (!prompt) {
    res.status(400).json({ error: "A prompt is required." });
    return;
  }
  if (requestedAgent !== "auto" && !validAgents.has(requestedAgent)) {
    res.status(400).json({ error: "Unknown Agent." });
    return;
  }
  let agent: AgentId = requestedAgent === "auto" ? "forge" : requestedAgent as AgentId;
  if (requestedAgent === "auto") { const text = prompt.toLowerCase(); agent = /deploy|end-to-end|autonomous|test everything/.test(text) ? "titan" : /architect|refactor|migration|performance|large/.test(text) ? "nexus" : /api|backend|database|auth|payment|full-stack/.test(text) ? "forge" : "spark"; }
  const run = { id: randomUUID(), projectId, userId: req.user!.id, agent, prompt, status: "running" as const, activities: [event(`${agentCatalog[agent].role} selected`, requestedAgent === "auto" ? `Auto routed this task to ${agentCatalog[agent].role}.` : `Using ${agentCatalog[agent].provider}.`, "complete")], tokensUsed: 0 };
  runs.set(run.id, run);
  res.status(202).json({ id: run.id, prompt, agent, status: run.status, currentOperation: "Inspecting project" });
  void executeRun(run).catch(() => undefined);
});

async function executeRun(run: { id: string; projectId: string; userId: string; agent: AgentId; prompt: string; status: "running" | "completed" | "failed"; activities: ActivityEvent[]; tokensUsed: number; error?: string }) {
  const add = (label: string, detail: string | null, status: ActivityEvent["status"]) => run.activities.unshift(event(label, detail, status));
  try {
    add("Inspecting project", "Detecting framework, runtime, package manager, and project structure.", "active");
    const context = await buildAgentContext(run.userId, run.projectId);
    add("Project analyzed", "Workspace inspection completed.", "complete");
    const provider = providerFor(run.agent);
    add("Requesting implementation plan", `${provider.getModelInfo().provider} model execution started.`, "active");
    const result = await provider.generate({ system: `You are ${agentCatalog[run.agent].role} in Firebox AI. Work only from the supplied project context. Explain the concrete next operation; never claim a file changed unless a tool changed it.`, prompt: `${run.prompt}\n\nProject context:\n${context}` });
    run.tokensUsed = (result.inputTokens ?? 0) + (result.outputTokens ?? 0);
    add("Agent response received", result.text.slice(0, 280) || "The provider returned no text.", "complete");
    run.status = "completed";
    add("Run complete", `${run.tokensUsed} provider tokens recorded.`, "complete");
  } catch (error) {
    run.status = "failed";
    run.error = error instanceof Error ? error.message : "Agent execution failed";
    add("Run failed", run.error, "failed");
  }
}

export default router;
