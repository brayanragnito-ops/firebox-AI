import type { ProviderId } from "../agents/contracts";

export type ProviderRequest = { system: string; prompt: string };
export type ProviderResult = { text: string; inputTokens: number; outputTokens: number };

export interface AIProvider {
  readonly provider: ProviderId;
  generate(input: ProviderRequest): Promise<ProviderResult>;
  getModelInfo(): { provider: ProviderId; model: string };
}

export type ProviderConfig = { provider: ProviderId; model: string; apiKey: string };

export function providerError(provider: ProviderId, message: string): Error {
  return new Error(`${provider} provider error: ${message}`);
}
