export type DeploymentProvider = "vercel" | "railway" | "render";
export type DeploymentRequest = { projectId: string; projectName: string; repository: string | null; environment: string };
export type DeploymentResult = { url: string | null; provider: DeploymentProvider; externalId: string | null };

const variables: Record<DeploymentProvider, string> = { vercel: "VERCEL_DEPLOY_HOOK_URL", railway: "RAILWAY_DEPLOY_HOOK_URL", render: "RENDER_DEPLOY_HOOK_URL" };

export async function triggerDeployment(provider: DeploymentProvider, request: DeploymentRequest): Promise<DeploymentResult> {
  const hook = process.env[variables[provider]];
  if (!hook) throw new Error(`${provider} deployment is not configured. Set ${variables[provider]} before deploying.`);
  const response = await fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request) });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(`${provider} deployment hook failed with HTTP ${response.status}.`);
  return { provider, url: typeof body.url === "string" ? body.url : null, externalId: typeof body.id === "string" ? body.id : null };
}

export function deploymentConfiguration() { return Object.fromEntries(Object.entries(variables).map(([provider, variable]) => [provider, { variable, configured: Boolean(process.env[variable]) }])); }
