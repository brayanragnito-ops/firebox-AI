import { agentCatalog, buildAgentContext, getProviderStatus, providerFor } from "./runtime";
import { agentIds, type AgentId } from "./contracts";

export type OrchestrationDecision = { agent: AgentId; rationale: string; provider: string };

function parseDecision(text: string): { agent?: string; rationale?: string } {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1] ?? text;
  const object = fenced.match(/\{[\s\S]*\}/)?.[0];
  if (!object) throw new Error("The orchestrator returned no structured Agent decision.");
  const parsed: unknown = JSON.parse(object);
  if (!parsed || typeof parsed !== "object") throw new Error("The orchestrator returned an invalid Agent decision.");
  const value = parsed as Record<string, unknown>;
  return { agent: typeof value.agent === "string" ? value.agent : undefined, rationale: typeof value.rationale === "string" ? value.rationale : undefined };
}

function configuredOrchestrator(): AgentId {
  const status = getProviderStatus() as Record<string, { configured: boolean; model: string | null; supported: boolean }>;
  const candidates: AgentId[] = ["nexus", "forge", "titan", "spark"];
  const candidate = candidates.find((agent) => { const provider = agentCatalog[agent].provider; const entry = status[provider]; return entry?.supported && entry.configured && Boolean(entry.model); });
  if (!candidate) throw new Error("Auto mode is unavailable. Configure at least one supported Agent provider and model.");
  return candidate;
}

export async function orchestrateTask(userId: string, projectId: string, prompt: string): Promise<OrchestrationDecision> {
  const orchestrator = configuredOrchestrator();
  const context = await buildAgentContext(userId, projectId);
  const provider = providerFor(orchestrator);
  const result = await provider.generate({ system: `You are the Firebox AI task orchestrator. Select exactly one Agent from: ${agentIds.join(", ")}. Return only JSON with keys agent and rationale. Do not invent provider capabilities.`, prompt: `${prompt}\n\nProject context:\n${context}` });
  const decision = parseDecision(result.text);
  if (!decision.agent || !agentIds.includes(decision.agent as AgentId)) throw new Error("The orchestrator selected an unknown Agent.");
  const agent = decision.agent as AgentId;
  return { agent, rationale: decision.rationale ?? "Selected from the task and project context.", provider: provider.getModelInfo().provider };
}
