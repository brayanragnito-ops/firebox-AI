import { Router } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/auth";
import { agentCatalog, buildAgentContext, getProviderStatus, providerFor } from "../agents/runtime";
import { agentIds, type AgentEventStatus, type AgentId } from "../agents/contracts";
import { projects } from "../services/mongo";
import { orchestrateTask } from "../agents/orchestrator";
import { appendAgentEvent, createAgentRun, getAgentRun, listAgentEvents, updateAgentRun } from "../services/agent-runs";

const router = Router();
const validAgents = new Set<string>(agentIds);

router.get("/agents", authMiddleware, (_req, res) => {
  const providers = getProviderStatus() as Record<string, { configured: boolean; variable: string; model: string | null; supported: boolean }>;
  res.json(Object.values(agentCatalog).map((agent) => ({ id: agent.id, provider: agent.provider, role: agent.positioning, description: agent.capabilities.join(", "), configured: providers[agent.provider].configured, model: providers[agent.provider].model, available: providers[agent.provider].supported && providers[agent.provider].configured && Boolean(process.env[agent.modelVariable]) })));
});

router.get("/projects/:projectId/agent-runs/:runId", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const run = await getAgentRun(String(req.params.runId), req.user!.id);
  if (!run || run.projectId !== String(req.params.projectId)) {
    res.status(404).json({ error: "Agent run not found" });
    return;
  }
  res.json(run);
});

router.get("/projects/:projectId/activity", authMiddleware, async (req: AuthenticatedRequest, res) => {
  res.json(await listAgentEvents(String(req.params.projectId), req.user!.id));
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
  let rationale = requestedAgent === "auto" ? "Auto mode is evaluating the task and project context." : `Using ${agentCatalog[agent].positioning}.`;
  if (requestedAgent === "auto") {
    try {
      const decision = await orchestrateTask(req.user!.id, projectId, prompt);
      agent = decision.agent;
      rationale = decision.rationale;
    } catch (error) {
      res.status(503).json({ error: error instanceof Error ? error.message : "Auto mode is unavailable." });
      return;
    }
  }
  const run = await createAgentRun({ userId: req.user!.id, projectId, agent, prompt, selectedBy: requestedAgent === "auto" ? "auto" : "user" });
  await appendAgentEvent({ runId: run.id, projectId, userId: req.user!.id, kind: "agent", status: "complete", label: `${agentCatalog[agent].label} selected`, detail: rationale, tool: null, metadata: { selectedBy: requestedAgent === "auto" ? "auto" : "user", rationale } });
  res.status(202).json({ ...run, currentOperation: "Inspecting project" });
  void executeRun(run).catch(() => undefined);
});

async function executeRun(run: Awaited<ReturnType<typeof createAgentRun>>) {
  const started = Date.now();
  const add = (status: AgentEventStatus, label: string, detail: string | null, metadata: Record<string, unknown> = {}) => appendAgentEvent({ runId: run.id, projectId: run.projectId, userId: run.userId, kind: "agent", status, label, detail, tool: null, metadata });
  try {
    await add("active", "Inspecting project", "Detecting framework, runtime, package manager, and project structure.");
    const context = await buildAgentContext(run.userId, run.projectId);
    await add("complete", "Project analyzed", "Workspace inspection completed.");
    const provider = providerFor(run.agent);
    await add("active", "Requesting implementation plan", `${provider.getModelInfo().provider} model execution started.`);
    const result = await provider.generate({ system: `You are ${agentCatalog[run.agent].positioning} in Firebox AI. Work only from the supplied project context. Explain the concrete next operation; never claim a file changed unless a tool changed it.`, prompt: `${run.prompt}\n\nProject context:\n${context}` });
    const tokensUsed = (result.inputTokens ?? 0) + (result.outputTokens ?? 0);
    await updateAgentRun(run.id, run.userId, { status: "completed", tokensUsed, apiCalls: 1, computeSeconds: Math.round((Date.now() - started) / 1000), completedAt: new Date() });
    await add("complete", "Agent response received", result.text.slice(0, 280) || "The provider returned no text.", { tokensUsed });
    await add("complete", "Run complete", `${tokensUsed} provider tokens recorded.`, { tokensUsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent execution failed";
    await updateAgentRun(run.id, run.userId, { status: "failed", error: message, apiCalls: 1, computeSeconds: Math.round((Date.now() - started) / 1000), completedAt: new Date() });
    await add("failed", "Run failed", message);
  }
}

export default router;
