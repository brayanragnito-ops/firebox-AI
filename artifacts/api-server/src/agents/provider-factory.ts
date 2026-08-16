import type { AgentDefinition, AgentId } from "./contracts";
import { AnthropicProvider, UnsupportedProvider } from "./provider-adapters";
import { OpenAICompatibleProvider } from "./provider-openai-compatible";
import type { AIProvider } from "./providers";

function configured(agent: AgentDefinition) {
  const apiKey = process.env[agent.apiKeyVariable];
  const model = process.env[agent.modelVariable];
  if (!apiKey) throw new Error(`${agent.label} is temporarily unavailable. Check the ${agent.apiKeyVariable} configuration.`);
  if (!model) throw new Error(`${agent.label} is temporarily unavailable. Configure ${agent.modelVariable} before running this Agent.`);
  return { apiKey, model };
}

export function providerForAgent(agentId: AgentId, agent: AgentDefinition): AIProvider {
  if (agent.provider === "gemini") return new UnsupportedProvider("gemini", `${agent.label} is not available until the Gemini adapter is configured.`);
  if (agent.provider === "fable5") return new UnsupportedProvider("fable5", `${agent.label} is not available because the Fable 5 API contract is not configured.`);
  const credentials = configured(agent);
  if (agent.provider === "anthropic") return new AnthropicProvider({ provider: "anthropic", ...credentials });
  if (agent.provider === "groq" || agent.provider === "openrouter" || agent.provider === "openai") return new OpenAICompatibleProvider({ provider: agent.provider, ...credentials });
  throw new Error(`No adapter registered for ${agent.provider}`);
}
