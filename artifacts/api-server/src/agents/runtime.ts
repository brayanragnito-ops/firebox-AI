import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { analyzeWorkspace, listWorkspace, readWorkspaceFile, writeWorkspaceFile } from "../services/workspace";
import type { AgentDefinition, AgentId, AgentEventStatus, ProviderId, ToolName } from "./contracts";
export type { AgentId, ProviderId } from "./contracts";

const exec = promisify(execFile);
export type ActivityStatus = AgentEventStatus;
export type ActivityEvent = { id: string; label: string; detail: string | null; status: ActivityStatus; timestamp: string };

export const agentCatalog: Record<AgentId, AgentDefinition> = {
  spark: { id: "spark", provider: "groq", role: "fast-coding", label: "Spark", positioning: "Fast & Lightweight", modelVariable: "SPARK_MODEL", apiKeyVariable: "GROQ_API_KEY", capabilities: ["simple websites", "UI changes", "small fixes"] },
  forge: { id: "forge", provider: "openrouter", role: "full-stack", label: "Forge", positioning: "Professional Full-Stack", modelVariable: "FORGE_MODEL", apiKeyVariable: "OPENROUTER_API_KEY", capabilities: ["APIs", "authentication", "integrations", "larger features"] },
  nexus: { id: "nexus", provider: "openai", role: "advanced-engineering", label: "Nexus", positioning: "Advanced Engineering", modelVariable: "NEXUS_MODEL", apiKeyVariable: "OPENAI_API_KEY", capabilities: ["complex architecture", "deep reasoning", "major refactoring"] },
  titan: { id: "titan", provider: "anthropic", role: "autonomous-engineering", label: "Titan", positioning: "Autonomous Engineering", modelVariable: "TITAN_MODEL", apiKeyVariable: "ANTHROPIC_API_KEY", capabilities: ["long-running tasks", "testing", "deployment workflows"] },
  aura: { id: "aura", provider: "gemini", role: "project-analysis", label: "Aura", positioning: "Project Analysis", modelVariable: "AURA_MODEL", apiKeyVariable: "GEMINI_API_KEY", capabilities: ["project analysis", "frontend development", "multimodal understanding"] },
  pulse: { id: "pulse", provider: "gemini", role: "debugging", label: "Pulse", positioning: "Fast Debugging", modelVariable: "PULSE_MODEL", apiKeyVariable: "GEMINI_API_KEY", capabilities: ["fast coding", "debugging", "documentation"] },
  vertex: { id: "vertex", provider: "fable5", role: "creative-development", label: "Vertex", positioning: "Creative Development", modelVariable: "VERTEX_MODEL", apiKeyVariable: "FABLE5_API_KEY", capabilities: ["creative development", "UI/UX", "code generation"] },
  vanguard: { id: "vanguard", provider: "fable5", role: "advanced-coding", label: "Vanguard", positioning: "Advanced Coding", modelVariable: "VANGUARD_MODEL", apiKeyVariable: "FABLE5_API_KEY", capabilities: ["advanced coding", "complex refactoring", "large changes"] },
};

export interface AIProvider {
  generate(input: { system: string; prompt: string }): Promise<{ text: string; inputTokens?: number; outputTokens?: number }>;
  getModelInfo(): { provider: ProviderId; model: string };
}

function requiredConfiguration(agent: AgentId) {
  const config = agentCatalog[agent];
  const apiKey = process.env[config.apiKeyVariable];
  const model = process.env[config.modelVariable];
  if (config.provider === "gemini" || config.provider === "fable5") throw new Error(`${config.label} is not available yet because the ${config.provider} adapter is not configured.`);
  if (!apiKey) throw new Error(`${config.label} is temporarily unavailable. Check the ${config.apiKeyVariable} configuration.`);
  if (!model) throw new Error(`${config.label} is temporarily unavailable. Configure ${config.modelVariable} before running this Agent.`);
  return { apiKey, model, provider: config.provider };
}

class HttpProvider implements AIProvider {
  constructor(private readonly agent: AgentId) {}
  getModelInfo() { const { provider, model } = requiredConfiguration(this.agent); return { provider, model }; }
  async generate(input: { system: string; prompt: string }) {
    const { apiKey, model, provider } = requiredConfiguration(this.agent);
    const response = provider === "anthropic"
      ? await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model, max_tokens: 4096, system: input.system, messages: [{ role: "user", content: input.prompt }] }) })
      : await fetch(provider === "groq" ? "https://api.groq.com/openai/v1/chat/completions" : provider === "openrouter" ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, messages: [{ role: "system", content: input.system }, { role: "user", content: input.prompt }] }) });
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new Error(typeof body.error === "object" && body.error && "message" in body.error ? String(body.error.message) : `${provider} request failed with HTTP ${response.status}`);
    if (provider === "anthropic") { const content = Array.isArray(body.content) ? body.content[0] : null; return { text: content && typeof content === "object" && "text" in content ? String(content.text) : "", inputTokens: Number((body.usage as Record<string, unknown> | undefined)?.input_tokens ?? 0), outputTokens: Number((body.usage as Record<string, unknown> | undefined)?.output_tokens ?? 0) }; }
    const choices = Array.isArray(body.choices) ? body.choices : [];
    const message = choices[0] && typeof choices[0] === "object" && "message" in choices[0] ? (choices[0] as Record<string, unknown>).message : null;
    return { text: message && typeof message === "object" && "content" in message ? String(message.content) : "", inputTokens: Number((body.usage as Record<string, unknown> | undefined)?.prompt_tokens ?? 0), outputTokens: Number((body.usage as Record<string, unknown> | undefined)?.completion_tokens ?? 0) };
  }
}

export function providerFor(agent: AgentId): AIProvider { return new HttpProvider(agent); }
export function getProviderStatus() { return Object.fromEntries([...new Set(Object.values(agentCatalog).map((agent) => agent.provider))].map((provider) => { const agent = Object.values(agentCatalog).find((item) => item.provider === provider)!; return [provider, { variable: agent.apiKeyVariable, configured: Boolean(process.env[agent.apiKeyVariable]), model: process.env[agent.modelVariable] ?? null, supported: provider !== "gemini" && provider !== "fable5" }]; })); }

function safeWorkspacePath(root: string, relativePath: string) { const target = path.resolve(root, relativePath); if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new Error("Path escapes the project workspace"); return target; }
export function createProjectTools(userId: string, projectId: string) {
  const root = path.resolve(process.env.FIREBOX_PROJECTS_ROOT ?? path.resolve(process.cwd(), ".firebox-workspaces"), userId, projectId);
  const command = (name: string, args: string[] = []) => exec(name, args, { cwd: root, timeout: 120000, maxBuffer: 1024 * 1024 });
  const tool = <T>(name: ToolName, execute: () => Promise<T>) => async () => execute();
  return {
    list_files: tool("list_files", () => listWorkspace(userId, projectId)),
    read_file: (filePath: string) => readWorkspaceFile(userId, projectId, filePath),
    write_file: (filePath: string, content: string) => writeWorkspaceFile(userId, projectId, filePath, content),
    edit_file: async (filePath: string, search: string, replacement: string) => { const target = safeWorkspacePath(root, filePath); const content = await readFile(target, "utf8"); if (!content.includes(search)) throw new Error(`Text not found in ${filePath}`); await writeFile(target, content.replace(search, replacement), "utf8"); },
    delete_file: (filePath: string) => rm(safeWorkspacePath(root, filePath), { recursive: true, force: false }),
    create_directory: (directory: string) => mkdir(safeWorkspacePath(root, directory), { recursive: true }),
    inspect_project: tool("inspect_project", () => analyzeWorkspace(userId, projectId)),
    run_command: (name: string, args: string[] = []) => command(name, args),
    install_package: (manager: string, packageName: string) => command(manager, ["add", packageName]),
    run_tests: (name: string, args: string[] = []) => command(name, args),
    build_project: (name: string, args: string[] = []) => command(name, args),
    start_project: (name: string, args: string[] = []) => command(name, args),
    stop_project: (pid: number) => Promise.resolve(process.kill(pid)),
    git_status: () => command("git", ["status", "--short"]),
    git_diff: () => command("git", ["diff"]),
    git_add: (files: string[]) => command("git", ["add", ...files]),
    git_commit: (message: string) => command("git", ["commit", "-m", message]),
    git_push: () => command("git", ["push"]),
    git_pull: () => command("git", ["pull", "--ff-only"]),
  };
}

export async function buildAgentContext(userId: string, projectId: string) { const tools = createProjectTools(userId, projectId); const [intelligence, files] = await Promise.all([tools.inspect_project(), tools.list_files()]); return JSON.stringify({ intelligence, files: files.slice(0, 200) }); }
