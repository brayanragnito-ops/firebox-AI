import type { ProviderId } from "./contracts";
import { providerError, type AIProvider, type ProviderConfig, type ProviderRequest, type ProviderResult } from "./providers";

export class AnthropicProvider implements AIProvider {
  readonly provider: ProviderId = "anthropic";
  constructor(private readonly config: ProviderConfig & { provider: "anthropic" }) {}
  getModelInfo() { return { provider: this.provider, model: this.config.model }; }
  async generate(input: ProviderRequest): Promise<ProviderResult> {
    const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": this.config.apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: this.config.model, max_tokens: 4096, system: input.system, messages: [{ role: "user", content: input.prompt }] }) });
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) { const error = typeof body.error === "object" && body.error && "message" in body.error ? String(body.error.message) : `HTTP ${response.status}`; throw providerError(this.provider, error); }
    const content = Array.isArray(body.content) ? body.content[0] : null;
    const usage = body.usage as Record<string, unknown> | undefined;
    return { text: content && typeof content === "object" && "text" in content ? String(content.text) : "", inputTokens: Number(usage?.input_tokens ?? 0), outputTokens: Number(usage?.output_tokens ?? 0) };
  }
}

export class UnsupportedProvider implements AIProvider {
  constructor(readonly provider: ProviderId, private readonly reason: string) {}
  getModelInfo(): { provider: ProviderId; model: string } { throw providerError(this.provider, this.reason); }
  async generate(_input: ProviderRequest): Promise<ProviderResult> { throw providerError(this.provider, this.reason); }
}
