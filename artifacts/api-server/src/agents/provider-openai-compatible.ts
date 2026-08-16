import type { ProviderId } from "./contracts";
import { providerError, type AIProvider, type ProviderConfig, type ProviderRequest, type ProviderResult } from "./providers";

const endpoints: Record<"groq" | "openrouter" | "openai", string> = { groq: "https://api.groq.com/openai/v1/chat/completions", openrouter: "https://openrouter.ai/api/v1/chat/completions", openai: "https://api.openai.com/v1/chat/completions" };

export class OpenAICompatibleProvider implements AIProvider {
  readonly provider: ProviderId;
  constructor(private readonly config: ProviderConfig & { provider: "groq" | "openrouter" | "openai" }) { this.provider = config.provider; }
  getModelInfo() { return { provider: this.provider, model: this.config.model }; }
  async generate(input: ProviderRequest): Promise<ProviderResult> {
    const response = await fetch(endpoints[this.config.provider], { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${this.config.apiKey}` }, body: JSON.stringify({ model: this.config.model, messages: [{ role: "system", content: input.system }, { role: "user", content: input.prompt }] }) });
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) { const error = typeof body.error === "object" && body.error && "message" in body.error ? String(body.error.message) : `HTTP ${response.status}`; throw providerError(this.provider, error); }
    const choices = Array.isArray(body.choices) ? body.choices : [];
    const message = choices[0] && typeof choices[0] === "object" && "message" in choices[0] ? (choices[0] as Record<string, unknown>).message : null;
    const usage = body.usage as Record<string, unknown> | undefined;
    return { text: message && typeof message === "object" && "content" in message ? String(message.content) : "", inputTokens: Number(usage?.prompt_tokens ?? 0), outputTokens: Number(usage?.completion_tokens ?? 0) };
  }
}
