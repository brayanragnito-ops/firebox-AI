export const agentIds = ["spark", "forge", "nexus", "titan", "aura", "pulse", "vertex", "vanguard"] as const;
export type AgentId = (typeof agentIds)[number];

export const providerIds = ["groq", "openrouter", "openai", "anthropic", "gemini", "fable5"] as const;
export type ProviderId = (typeof providerIds)[number];

export type AgentRole =
  | "fast-coding"
  | "full-stack"
  | "advanced-engineering"
  | "autonomous-engineering"
  | "project-analysis"
  | "debugging"
  | "creative-development"
  | "advanced-coding";

export type ToolName =
  | "list_files"
  | "read_file"
  | "write_file"
  | "edit_file"
  | "delete_file"
  | "search_files"
  | "create_directory"
  | "install_package"
  | "run_command"
  | "get_process_status"
  | "start_project"
  | "stop_project"
  | "get_terminal_output"
  | "git_status"
  | "git_diff"
  | "git_add"
  | "git_commit"
  | "git_push"
  | "git_pull"
  | "run_tests"
  | "build_project"
  | "inspect_project"
  | "deploy_project";

export type AgentStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type AgentEventStatus = "queued" | "active" | "complete" | "failed";
export type AgentEventKind = "agent" | "tool" | "handoff" | "terminal" | "system";

export type AgentDefinition = {
  id: AgentId;
  provider: ProviderId;
  role: AgentRole;
  label: string;
  positioning: string;
  modelVariable: string;
  apiKeyVariable: string;
  capabilities: readonly string[];
};

export type AgentEvent = {
  id: string;
  runId: string;
  projectId: string;
  userId: string;
  kind: AgentEventKind;
  status: AgentEventStatus;
  label: string;
  detail: string | null;
  tool: ToolName | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AgentRun = {
  id: string;
  userId: string;
  projectId: string;
  agent: AgentId;
  prompt: string;
  status: AgentStatus;
  selectedBy: "user" | "auto" | "handoff";
  tokensUsed: number;
  apiCalls: number;
  computeSeconds: number;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
};

export type CreateAgentRunInput = {
  userId: string;
  projectId: string;
  agent: AgentId;
  prompt: string;
  selectedBy: AgentRun["selectedBy"];
};
