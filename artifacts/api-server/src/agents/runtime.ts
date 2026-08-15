export const agentCatalog = {
  spark: { provider: "groq", role: "Fast & Lightweight", icon: "Spark" },
  forge: { provider: "openrouter", role: "Professional Full-Stack", icon: "Forge" },
  nexus: { provider: "openai", role: "Advanced Engineering", icon: "Nexus" },
  titan: { provider: "anthropic", role: "Autonomous Engineering", icon: "Titan" },
} as const;

export type AgentId = keyof typeof agentCatalog;
type ProviderId = (typeof agentCatalog)[AgentId]["provider"];

const providerEnvironment: Record<ProviderId, string> = {
  groq: "GROQ_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

export function getProviderStatus() {
  return Object.fromEntries(
    Object.entries(providerEnvironment).map(([provider, variable]) => [provider, { variable, configured: Boolean(process.env[variable]) }]),
  );
}
