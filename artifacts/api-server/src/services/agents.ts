/**
 * Agent Service
 * Handles AI agent execution, prompting, and response generation
 */

export interface AgentPrompt {
  type: "analyze" | "fix" | "generate" | "refactor" | "optimize" | "document";
  content: string;
  context?: {
    filePath?: string;
    selectedCode?: string;
    projectFramework?: string;
    language?: string;
  };
}

export interface AgentResponse {
  agentName: string;
  agentType: string;
  status: "thinking" | "analyzing" | "generating" | "complete" | "error";
  message: string;
  suggestions?: string[];
  code?: string;
  explanation?: string;
  confidence?: number;
}

export interface AgentActivity {
  type: string;
  message: string;
  timestamp: Date;
  status: "pending" | "complete" | "error";
  result?: string;
}

// Agent profiles with different specializations
const AGENTS = {
  spark: {
    name: "Spark",
    type: "analyzer",
    description: "Fast code analyzer - detects issues and suggests quick fixes",
    capabilities: ["analyze", "fix", "optimize"],
    speed: "fast",
  },
  forge: {
    name: "Forge",
    type: "generator",
    description: "Code generator - creates new components and features",
    capabilities: ["generate", "refactor", "document"],
    speed: "medium",
  },
  nexus: {
    name: "Nexus",
    type: "architect",
    description: "Architecture advisor - suggests structure and design patterns",
    capabilities: ["analyze", "refactor", "generate"],
    speed: "slow",
  },
  titan: {
    name: "Titan",
    type: "optimizer",
    description: "Performance optimizer - improves speed and efficiency",
    capabilities: ["optimize", "analyze", "fix"],
    speed: "medium",
  },
  aura: {
    name: "Aura",
    type: "style",
    description: "Style guide enforcer - ensures code quality and consistency",
    capabilities: ["analyze", "fix"],
    speed: "fast",
  },
  pulse: {
    name: "Pulse",
    type: "debugger",
    description: "Debug assistant - tracks down and fixes bugs",
    capabilities: ["analyze", "fix", "refactor"],
    speed: "medium",
  },
  vertex: {
    name: "Vertex",
    type: "security",
    description: "Security auditor - finds and fixes security vulnerabilities",
    capabilities: ["analyze", "fix"],
    speed: "slow",
  },
  vanguard: {
    name: "Vanguard",
    type: "tester",
    description: "Test writer - generates comprehensive test suites",
    capabilities: ["generate", "optimize"],
    speed: "medium",
  },
};

export function getAgent(agentName: string) {
  const agent = AGENTS[agentName as keyof typeof AGENTS];
  return agent || null;
}

export function listAgents() {
  return Object.entries(AGENTS).map(([key, agent]) => ({
    id: key,
    ...agent,
  }));
}

/**
 * Process agent prompt and generate response
 * In production, this would call an LLM API (OpenAI, Claude, etc.)
 * For now, returns realistic mock responses
 */
export async function executeAgent(
  agentName: string,
  prompt: AgentPrompt
): Promise<AgentResponse> {
  const agent = getAgent(agentName);
  if (!agent) {
    return {
      agentName: "Unknown",
      agentType: "error",
      status: "error",
      message: "Agent not found",
      confidence: 0,
    };
  }

  // Simulate processing time based on agent speed
  const delay = {
    fast: 500,
    medium: 1000,
    slow: 1500,
  }[agent.speed];

  await new Promise((resolve) => setTimeout(resolve, delay));

  // Generate mock responses based on prompt type
  const responses = generateMockResponse(agent.name, prompt);

  return {
    agentName: agent.name,
    agentType: agent.type,
    status: "complete",
    message: responses.message ?? "",
    suggestions: responses.suggestions,
    code: responses.code,
    explanation: responses.explanation,
    confidence: responses.confidence ?? 0,
  };
}

function generateMockResponse(
  agentName: string,
  prompt: AgentPrompt
): Partial<AgentResponse> {
  const { type, content, context } = prompt;

  switch (type) {
    case "analyze":
      return {
        message: `${agentName} analyzed your code and found ${Math.floor(Math.random() * 5) + 1} potential issues.`,
        suggestions: [
          "Consider using const instead of let for immutable values",
          "Add error handling for async operations",
          "Add type annotations for better type safety",
          "Extract repeated logic into helper functions",
        ].slice(0, Math.floor(Math.random() * 3) + 1),
        confidence: Math.floor(Math.random() * 30) + 70,
      };

    case "fix":
      return {
        message: `${agentName} generated a fix for the identified issues.`,
        code: `// Fixed version\n${
          context?.selectedCode
            ? context.selectedCode.replace(/let /g, "const ")
            : "const result = await fetchData();\nreturn result;"
        }`,
        explanation:
          "Changed 'let' to 'const' where values are not reassigned, added error handling",
        confidence: Math.floor(Math.random() * 20) + 80,
      };

    case "generate":
      return {
        message: `${agentName} generated a new component based on your request.`,
        code: `export function ${context?.filePath?.split("/").pop()?.replace(".tsx", "") || "Component"}() {\n  return (\n    <div className="component">\n      {/* Your code here */}\n    </div>\n  );\n}`,
        explanation: "Created a functional component with proper TypeScript types",
        confidence: Math.floor(Math.random() * 20) + 75,
      };

    case "refactor":
      return {
        message: `${agentName} refactored your code for better maintainability.`,
        suggestions: [
          "Extract component into separate file",
          "Use custom hooks to reduce duplication",
          "Implement composition pattern",
        ],
        confidence: Math.floor(Math.random() * 20) + 70,
      };

    case "optimize":
      return {
        message: `${agentName} found optimization opportunities. Estimated 40% performance improvement.`,
        suggestions: [
          "Use React.memo for expensive components",
          "Implement lazy loading for heavy imports",
          "Add pagination instead of loading all data",
        ],
        confidence: Math.floor(Math.random() * 15) + 75,
      };

    case "document":
      return {
        message: `${agentName} generated documentation for your code.`,
        code: `/**\n * ${context?.filePath?.split("/").pop() || "MyFunction"}\n * @description Brief description of what this does\n * @param {string} param1 - First parameter\n * @returns {Promise<boolean>} Result of operation\n */`,
        explanation: "Added JSDoc comments with proper typing",
        confidence: Math.floor(Math.random() * 20) + 80,
      };

    default:
      return {
        message: `${agentName} is processing your request...`,
        confidence: 60,
      };
  }
}

/**
 * Create activity log entry from agent response
 */
export function createActivityLog(
  agentName: string,
  response: AgentResponse
): AgentActivity {
  return {
    type: `${agentName} ${response.status}`,
    message: response.message,
    timestamp: new Date(),
    status: response.status === "error" ? "error" : "complete",
    result: response.code || response.explanation,
  };
}
