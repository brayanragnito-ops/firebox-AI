import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { stat, readdir, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { analyzeWorkspace, listWorkspace, readWorkspaceFile, writeWorkspaceFile } from "../services/workspace";

const exec = promisify(execFile);

export type AgentId = "spark" | "forge" | "nexus" | "titan";
export type ProviderId = "groq" | "openrouter" | "openai" | "anthropic";
export type ActivityStatus = "complete" | "active" | "queued" | "failed";
export type ActivityEvent = { id: string; label: string; detail: string | null; status: ActivityStatus; timestamp: string };

export const agentCatalog: Record<AgentId, { provider: ProviderId; role: string; description: string; modelVariable: string; apiKeyVariable: string }> = {
  spark: { provider: "groq", role: "Fast & Lightweight", description: "Fast everyday development for websites, UI changes, components, and quick fixes.", modelVariable: "SPARK_MODEL", apiKeyVariable: "GROQ_API_KEY" },
  forge: { provider: "openrouter", role: "Professional Full-Stack", description: "Full-stack engineering for APIs, authentication, payments, databases, and larger features.", modelVariable: "FORGE_MODEL", apiKeyVariable: "OPENROUTER_API_KEY" },
  nexus: { provider: "openai", role: "Advanced Engineering", description: "Deep analysis, architecture, refactoring, migrations, and complex multi-file changes.", modelVariable: "NEXUS_MODEL", apiKeyVariable: "OPENAI_API_KEY" },
  titan: { provider: "anthropic", role: "Autonomous Engineering", description: "End-to-end engineering with planning, testing, debugging, and deployment preparation.", modelVariable: "TITAN_MODEL", apiKeyVariable: "ANTHROPIC_API_KEY" },
};

export interface AIProvider {
  generate(input: { system: string; prompt: string }): Promise<{ text: string; inputTokens?: number; outputTokens?: number }>;
  getModelInfo(): { provider: ProviderId; model: string };
}

function requiredConfiguration(agent: AgentId) {
  const config = agentCatalog[agent];
  const apiKey = process.env[config.apiKeyVariable];
  const model = process.env[config.modelVariable];
  if (!apiKey) throw new Error(`${config.role} is temporarily unavailable. Check the ${config.apiKeyVariable} configuration.`);
  if (!model) throw new Error(`${config.role} is temporarily unavailable. Configure ${config.modelVariable} before running this Agent.`);
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
    if (provider === "anthropic") {
      const content = Array.isArray(body.content) ? body.content[0] : null;
      return { text: content && typeof content === "object" && "text" in content ? String(content.text) : "", inputTokens: Number((body.usage as Record<string, unknown> | undefined)?.input_tokens ?? 0), outputTokens: Number((body.usage as Record<string, unknown> | undefined)?.output_tokens ?? 0) };
    }
    const choices = Array.isArray(body.choices) ? body.choices : [];
    const message = choices[0] && typeof choices[0] === "object" && "message" in choices[0] ? (choices[0] as Record<string, unknown>).message : null;
    return { text: message && typeof message === "object" && "content" in message ? String(message.content) : "", inputTokens: Number((body.usage as Record<string, unknown> | undefined)?.prompt_tokens ?? 0), outputTokens: Number((body.usage as Record<string, unknown> | undefined)?.completion_tokens ?? 0) };
  }
}

export function providerFor(agent: AgentId): AIProvider { return new HttpProvider(agent); }
export function getProviderStatus() { return Object.fromEntries(Object.values(agentCatalog).map((agent) => [agent.provider, { variable: agent.apiKeyVariable, configured: Boolean(process.env[agent.apiKeyVariable]), model: process.env[agent.modelVariable] ?? null }])); }

function safeWorkspacePath(root: string, relativePath: string) { const target = path.resolve(root, relativePath); if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new Error("Path escapes the project workspace"); return target; }
export function createProjectTools(userId: string, projectId: string) {
  const root = path.resolve(process.env.WORKSPACE_ROOT ?? path.resolve(process.cwd(), ".firebox-workspaces"), userId, projectId);
  return {
    list_files: () => listWorkspace(userId, projectId),
    read_file: (filePath: string) => readWorkspaceFile(userId, projectId, filePath),
    write_file: (filePath: string, content: string) => writeWorkspaceFile(userId, projectId, filePath, content),
    edit_file: async (filePath: string, search: string, replacement: string) => { const target = safeWorkspacePath(root, filePath); const content = await readFile(target, "utf8"); if (!content.includes(search)) throw new Error(`Text not found in ${filePath}`); await writeFile(target, content.replace(search, replacement), "utf8"); },
    delete_file: (filePath: string) => rm(safeWorkspacePath(root, filePath), { recursive: true, force: false }),
    create_directory: (directory: string) => mkdir(safeWorkspacePath(root, directory), { recursive: true }),
    inspect_project: () => analyzeWorkspace(userId, projectId),
    run_command: async (command: string, args: string[] = []) => { const result = await exec(command, args, { cwd: root, timeout: 120000, maxBuffer: 1024 * 1024 }); return `${result.stdout}${result.stderr}`; },
    install_package: (manager: string, packageName: string) => exec(manager, ["add", packageName], { cwd: root, timeout: 120000 }),
    run_tests: (command: string, args: string[] = []) => exec(command, args, { cwd: root, timeout: 120000 }),
    build_project: (command: string, args: string[] = []) => exec(command, args, { cwd: root, timeout: 120000 }),
    start_project: (command: string, args: string[] = []) => exec(command, args, { cwd: root, timeout: 120000 }),
    stop_project: (pid: number) => process.kill(pid),
    git_status: () => exec("git", ["status", "--short"], { cwd: root }),
    git_diff: () => exec("git", ["diff"], { cwd: root }),
    git_add: (files: string[]) => exec("git", ["add", ...files], { cwd: root }),
    git_commit: (message: string) => exec("git", ["commit", "-m", message], { cwd: root }),
    git_push: () => exec("git", ["push"], { cwd: root }),
    git_pull: () => exec("git", ["pull", "--ff-only"], { cwd: root }),
  };
}

export async function buildAgentContext(userId: string, projectId: string) {
  const tools = createProjectTools(userId, projectId);
  const [intelligence, files] = await Promise.all([tools.inspect_project(), tools.list_files()]);
  return JSON.stringify({ intelligence, files: files.slice(0, 200) });
}
