import { useState } from "react";
import { Button } from "../components/ui/button";
import { Loader, Sparkles, AlertCircle, CheckCircle } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  capabilities: string[];
  speed: "fast" | "medium" | "slow";
}

interface AgentResponse {
  agentName: string;
  agentType: string;
  status: string;
  message: string;
  suggestions?: string[];
  code?: string;
  explanation?: string;
  confidence?: number;
}

interface AgentsPanelProps {
  projectId: string;
  selectedCode?: string;
  onAgentRun: (agentName: string, prompt: any) => Promise<AgentResponse | null>;
  isLoading: boolean;
}

export default function AgentsPanel({
  projectId,
  selectedCode,
  onAgentRun,
  isLoading,
}: AgentsPanelProps) {
  const [agents] = useState<Agent[]>([
    {
      id: "spark",
      name: "Spark",
      type: "analyzer",
      description: "Fast code analyzer - detects issues",
      capabilities: ["analyze", "fix"],
      speed: "fast",
    },
    {
      id: "forge",
      name: "Forge",
      type: "generator",
      description: "Code generator - creates components",
      capabilities: ["generate", "refactor"],
      speed: "medium",
    },
    {
      id: "nexus",
      name: "Nexus",
      type: "architect",
      description: "Architecture advisor - suggests design patterns",
      capabilities: ["analyze", "refactor"],
      speed: "slow",
    },
    {
      id: "titan",
      name: "Titan",
      type: "optimizer",
      description: "Performance optimizer - improves speed",
      capabilities: ["optimize", "analyze"],
      speed: "medium",
    },
    {
      id: "aura",
      name: "Aura",
      type: "style",
      description: "Style guide enforcer - ensures code quality",
      capabilities: ["analyze", "fix"],
      speed: "fast",
    },
    {
      id: "pulse",
      name: "Pulse",
      type: "debugger",
      description: "Debug assistant - finds and fixes bugs",
      capabilities: ["analyze", "fix"],
      speed: "medium",
    },
    {
      id: "vertex",
      name: "Vertex",
      type: "security",
      description: "Security auditor - finds vulnerabilities",
      capabilities: ["analyze", "fix"],
      speed: "slow",
    },
    {
      id: "vanguard",
      name: "Vanguard",
      type: "tester",
      description: "Test writer - generates test suites",
      capabilities: ["generate"],
      speed: "medium",
    },
  ]);

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<AgentResponse | null>(null);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);

  const handleRunAgent = async (agentId: string) => {
    setRunningAgent(agentId);
    setSelectedAgent(agentId);

    try {
      const response = await onAgentRun(agentId, {
        type: "analyze",
        content: selectedCode || "Analyze this code",
        selectedCode,
      });

      if (response) {
        setLastResponse(response);
      }
    } catch (error) {
      console.error("Agent run failed:", error);
    } finally {
      setRunningAgent(null);
    }
  };

  const speedColors = {
    fast: "text-green-600",
    medium: "text-blue-600",
    slow: "text-orange-600",
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto">
        {/* Agents Grid */}
        <div className="p-4 space-y-2">
          <h3 className="text-sm font-bold mb-3">AI Agents</h3>
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`border rounded-lg p-3 cursor-pointer transition-all ${
                selectedAgent === agent.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedAgent(agent.id)}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-yellow-500" />
                  <span className="font-semibold text-sm">{agent.name}</span>
                </div>
                <span className={`text-xs font-medium ${speedColors[agent.speed]}`}>
                  {agent.speed}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{agent.description}</p>
              <div className="flex gap-1 mb-2 flex-wrap">
                {agent.capabilities.slice(0, 2).map((cap) => (
                  <span
                    key={cap}
                    className="text-xs bg-gray-100 px-2 py-0.5 rounded"
                  >
                    {cap}
                  </span>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRunAgent(agent.id);
                }}
                disabled={runningAgent !== null || isLoading}
              >
                {runningAgent === agent.id ? (
                  <>
                    <Loader size={12} className="animate-spin mr-1" />
                    Running...
                  </>
                ) : (
                  "Run Agent"
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Response Display */}
        {lastResponse && (
          <div className="border-t p-4">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              {lastResponse.status === "complete" ? (
                <CheckCircle size={14} className="text-green-600" />
              ) : (
                <AlertCircle size={14} className="text-orange-600" />
              )}
              {lastResponse.agentName} Response
            </h4>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-1">
                  Message
                </p>
                <p className="text-sm text-gray-800">{lastResponse.message}</p>
              </div>

              {lastResponse.confidence && (
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">
                    Confidence
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${lastResponse.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">
                      {lastResponse.confidence}%
                    </span>
                  </div>
                </div>
              )}

              {lastResponse.suggestions && lastResponse.suggestions.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">
                    Suggestions
                  </p>
                  <ul className="space-y-1">
                    {lastResponse.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-xs text-gray-700 flex gap-2">
                        <span className="text-blue-500 flex-shrink-0">→</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {lastResponse.code && (
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">
                    Generated Code
                  </p>
                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto border border-gray-200">
                    {lastResponse.code}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 text-xs"
                  >
                    Apply Changes
                  </Button>
                </div>
              )}

              {lastResponse.explanation && (
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">
                    Explanation
                  </p>
                  <p className="text-xs text-gray-700">
                    {lastResponse.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
