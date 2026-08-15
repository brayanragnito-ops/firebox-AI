import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Loader, Rocket, Globe, Lock, Trash2, Undo2 } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  icon: string;
  description: string;
  regions: string[];
  features: string[];
}

interface DeploymentStatus {
  id: string;
  provider: string;
  status: "pending" | "building" | "deploying" | "live" | "failed" | "rollback";
  url?: string;
  message: string;
  progress?: number;
  timestamp: Date;
  duration?: number;
}

interface EnvVariable {
  key: string;
  value: string;
  encrypted: boolean;
  scope: "production" | "preview" | "development";
}

interface DeploymentsPanelProps {
  projectId: string;
  projectName: string;
  onDeploy: (provider: string, config: any) => Promise<any>;
  isDeploying: boolean;
}

export default function DeploymentsPanel({
  projectId,
  projectName,
  onDeploy,
  isDeploying,
}: DeploymentsPanelProps) {
  const [providers] = useState<Provider[]>([
    {
      id: "vercel",
      name: "Vercel",
      icon: "⚡",
      description: "Next.js & React frontends",
      regions: ["US", "Europe", "Asia"],
      features: ["Auto-deploy", "Preview URLs", "Analytics"],
    },
    {
      id: "netlify",
      name: "Netlify",
      icon: "🔷",
      description: "Jamstack & static sites",
      regions: ["US", "Europe"],
      features: ["CI/CD", "Functions", "Forms"],
    },
    {
      id: "heroku",
      name: "Heroku",
      icon: "🟣",
      description: "Full-stack apps",
      regions: ["US", "EU", "APAC"],
      features: ["Dynos", "PostgreSQL", "Redis"],
    },
    {
      id: "aws",
      name: "AWS",
      icon: "🟠",
      description: "Enterprise cloud",
      regions: ["us-east-1", "us-west-2", "eu-west-1"],
      features: ["EC2", "Lambda", "S3"],
    },
    {
      id: "digitalocean",
      name: "DigitalOcean",
      icon: "🔵",
      description: "Simple cloud VPS",
      regions: ["NYC", "SFO", "LON"],
      features: ["Droplets", "Databases"],
    },
    {
      id: "railway",
      name: "Railway",
      icon: "🚂",
      description: "Modern platform",
      regions: ["US-West", "US-East", "EU"],
      features: ["Git integration", "Databases"],
    },
  ]);

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [envVariables, setEnvVariables] = useState<EnvVariable[]>([
    {
      key: "NODE_ENV",
      value: "production",
      encrypted: false,
      scope: "production",
    },
  ]);
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);

  const handleDeploy = async () => {
    if (!selectedProvider) {
      alert("Please select a provider");
      return;
    }

    const config = {
      provider: selectedProvider,
      region: selectedRegion,
      environment: Object.fromEntries(
        envVariables.map((v) => [v.key, v.value])
      ),
    };

    try {
      const result = await onDeploy(selectedProvider, config);
      setDeploymentStatus(result.status);
    } catch (error) {
      console.error("Deployment failed:", error);
    }
  };

  const handleAddEnvVar = () => {
    if (!newEnvKey.trim() || !newEnvValue.trim()) return;

    setEnvVariables([
      ...envVariables,
      {
        key: newEnvKey,
        value: newEnvValue,
        encrypted: true,
        scope: "production",
      },
    ]);

    setNewEnvKey("");
    setNewEnvValue("");
  };

  const handleRemoveEnvVar = (key: string) => {
    setEnvVariables(envVariables.filter((v) => v.key !== key));
  };

  const currentProvider = providers.find((p) => p.id === selectedProvider);

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      <div className="p-4 border-b sticky top-0 bg-white">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Rocket size={16} />
          Deployments
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Provider Selection */}
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-2">
            Select Provider
          </label>
          <div className="grid grid-cols-2 gap-2">
            {providers.map((provider) => (
              <div
                key={provider.id}
                onClick={() => {
                  setSelectedProvider(provider.id);
                  setSelectedRegion(provider.regions[0] || "");
                }}
                className={`p-2 border rounded cursor-pointer transition-all ${
                  selectedProvider === provider.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-lg mb-1">{provider.icon}</div>
                <div className="text-xs font-medium">{provider.name}</div>
                <div className="text-[10px] text-gray-600">
                  {provider.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Region Selection */}
        {currentProvider && (
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-2">
              Region
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
            >
              {currentProvider.regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Environment Variables */}
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-2 flex items-center gap-1">
            <Lock size={12} />
            Environment Variables
          </label>

          <div className="space-y-2 mb-2">
            {envVariables.map((variable) => (
              <div
                key={variable.key}
                className="flex items-center gap-2 bg-gray-50 p-2 rounded"
              >
                <div className="flex-1">
                  <div className="text-xs font-medium">{variable.key}</div>
                  <div className="text-[10px] text-gray-600">
                    {variable.encrypted ? "🔒 Encrypted" : ""}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveEnvVar(variable.key)}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <Trash2 size={12} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Env Var */}
          <div className="flex gap-1 mb-2">
            <input
              type="text"
              placeholder="Key"
              value={newEnvKey}
              onChange={(e) => setNewEnvKey(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
            />
            <input
              type="password"
              placeholder="Value"
              value={newEnvValue}
              onChange={(e) => setNewEnvValue(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddEnvVar}
              className="text-xs"
            >
              Add
            </Button>
          </div>
        </div>

        {/* Deploy Button */}
        <Button
          onClick={handleDeploy}
          disabled={isDeploying || !selectedProvider}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isDeploying ? (
            <>
              <Loader size={14} className="animate-spin mr-2" />
              Deploying...
            </>
          ) : (
            <>
              <Rocket size={14} className="mr-2" />
              Deploy Now
            </>
          )}
        </Button>

        {/* Deployment Status */}
        {deploymentStatus && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold">
                {deploymentStatus.status.toUpperCase()}
              </div>
              {deploymentStatus.progress && (
                <span className="text-xs text-gray-600">
                  {deploymentStatus.progress}%
                </span>
              )}
            </div>

            {deploymentStatus.progress !== undefined && (
              <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
                <div
                  className="bg-blue-600 h-1 rounded-full transition-all"
                  style={{ width: `${deploymentStatus.progress}%` }}
                />
              </div>
            )}

            <p className="text-xs text-gray-700 mb-2">
              {deploymentStatus.message}
            </p>

            {deploymentStatus.url && (
              <a
                href={deploymentStatus.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <Globe size={12} />
                {deploymentStatus.url}
              </a>
            )}

            {deploymentStatus.status === "live" && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs flex-1"
                  onClick={() => window.open(deploymentStatus.url)}
                >
                  Visit Site
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs flex-1"
                >
                  <Undo2 size={12} className="mr-1" />
                  Rollback
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Deployment History */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            Recent Deployments
          </h4>
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">v{i + 1}</span>
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Live
                  </span>
                </div>
                <div className="text-[10px] text-gray-600 mb-1">
                  Deployed{" "}
                  {i === 0
                    ? "5 minutes ago"
                    : "2 days ago"}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] flex-1"
                  >
                    <Globe size={10} className="mr-1" />
                    Visit
                  </Button>
                  {i > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[10px] flex-1"
                    >
                      <Undo2 size={10} className="mr-1" />
                      Rollback
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
