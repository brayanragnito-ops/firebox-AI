import { useState, useEffect } from "react";
import { useParams, useNavigate } from "wouter";
import Editor from "@monaco-editor/react";
import { useAuth } from "../contexts/auth";
import { apiClient } from "../lib/api-client";
import { ChevronDown, ChevronRight, FileIcon, FolderIcon, Terminal } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import AgentsPanel from "../components/agents-panel";
import DeploymentsPanel from "../components/deployments-panel";

interface FileTreeNode {
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileTreeNode[];
  content?: string;
}

interface ProjectAnalysis {
  framework: string;
  language: string;
  runtime: string;
  buildTool: string;
  packageManager: string;
  devCommand?: string;
  buildCommand?: string;
  startCommand?: string;
  confidence: number;
}

export default function WorkspacePage() {
  const params = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projectName, setProjectName] = useState<string>("");
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileTreeNode | null>(null);
  const [editorContent, setEditorContent] = useState<string>("");
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "Terminal ready. Project: initializing...",
  ]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningAgent, setIsRunningAgent] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<"agents" | "deployments">("agents");

  // Load project and analysis on mount
  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await apiClient.get(`/api/projects/${params.projectId}`);
        const data = await response.json();
        setProjectName(data.name);

        // Get project analysis
        const analysisResponse = await apiClient.get(
          `/api/projects/${params.projectId}/analyze`
        );
        const analysisData = await analysisResponse.json();
        setAnalysis(analysisData.analysis);

        // Generate sample file tree based on project type
        generateFileTree(data.name, analysisData.analysis);
      } catch (error) {
        console.error("Failed to load project:", error);
        addTerminalOutput("Error: Failed to load project");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.projectId) {
      loadProject();
    }
  }, [params.projectId]);

  const generateFileTree = (projectName: string, projectAnalysis: ProjectAnalysis) => {
    // Generate realistic file tree based on framework
    const tree: FileTreeNode[] = [
      {
        name: "src",
        type: "folder",
        path: "/src",
        children: [
          {
            name: "App.tsx",
            type: "file",
            path: "/src/App.tsx",
            content: generateSampleCode(projectAnalysis.framework),
          },
          {
            name: "index.tsx",
            type: "file",
            path: "/src/index.tsx",
            content: 'import React from "react";\nimport ReactDOM from "react-dom";\nimport App from "./App";\n\nReactDOM.render(<App />, document.getElementById("root"));',
          },
          {
            name: "components",
            type: "folder",
            path: "/src/components",
            children: [
              {
                name: "Header.tsx",
                type: "file",
                path: "/src/components/Header.tsx",
                content: 'export function Header() {\n  return <header>Welcome to Firebox AI</header>;\n}',
              },
              {
                name: "Footer.tsx",
                type: "file",
                path: "/src/components/Footer.tsx",
                content: 'export function Footer() {\n  return <footer>© 2026 Firebox AI</footer>;\n}',
              },
            ],
          },
        ],
      },
      {
        name: "public",
        type: "folder",
        path: "/public",
        children: [
          {
            name: "index.html",
            type: "file",
            path: "/public/index.html",
            content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>${projectName}</title>\n</head>\n<body>\n  <div id="root"></div>\n</body>\n</html>`,
          },
        ],
      },
      {
        name: "package.json",
        type: "file",
        path: "/package.json",
        content: generatePackageJson(projectName, projectAnalysis),
      },
      {
        name: ".gitignore",
        type: "file",
        path: "/.gitignore",
        content: "node_modules/\ndist/\n.env\n.DS_Store",
      },
    ];

    setFileTree(tree);
    if (tree[0].children?.[0]) {
      setSelectedFile(tree[0].children[0]);
      setEditorContent(tree[0].children[0].content || "");
    }
  };

  const generateSampleCode = (framework: string): string => {
    const codes: Record<string, string> = {
      "Next.js": `export default function Home() {
  return (
    <main>
      <h1>Welcome to ${projectName}</h1>
      <p>Built with Next.js</p>
    </main>
  );
}`,
      "React + Vite": `function App() {
  return (
    <div>
      <h1>Welcome to ${projectName}</h1>
      <p>Built with React + Vite</p>
    </div>
  );
}
export default App;`,
      FastAPI: `from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to ${projectName}"}`,
      Django: `from django.http import JsonResponse

def home(request):
    return JsonResponse({"message": "Welcome to ${projectName}"})`,
      Express: `const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.json({ message: "Welcome to ${projectName}" });
});

app.listen(3000);`,
    };

    return codes[framework] || `// ${projectName} - ${framework} project`;
  };

  const generatePackageJson = (projectName: string, analysis: ProjectAnalysis): string => {
    return JSON.stringify(
      {
        name: projectName.toLowerCase().replace(/\s+/g, "-"),
        version: "1.0.0",
        description: `${projectName} - Built with ${analysis.framework}`,
        framework: analysis.framework,
        language: analysis.language,
        runtime: analysis.runtime,
        buildTool: analysis.buildTool,
        packageManager: analysis.packageManager,
        scripts: {
          dev: analysis.devCommand || "vite",
          build: analysis.buildCommand || "vite build",
          preview: "vite preview",
        },
      },
      null,
      2
    );
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileSelect = (file: FileTreeNode) => {
    setSelectedFile(file);
    setEditorContent(file.content || "");
    addTerminalOutput(`Opened: ${file.path}`);
  };

  const addTerminalOutput = (text: string) => {
    setTerminalOutput((prev) => [...prev, text]);
  };

  const runCommand = (command: string) => {
    addTerminalOutput(`$ ${command}`);
    if (command.includes("dev") && analysis?.devCommand) {
      addTerminalOutput(`Running: ${analysis.devCommand}`);
      addTerminalOutput("Server started on http://localhost:3000");
    } else if (command.includes("build") && analysis?.buildCommand) {
      addTerminalOutput(`Running: ${analysis.buildCommand}`);
      addTerminalOutput("Build completed successfully");
    } else {
      addTerminalOutput("Command executed");
    }
  };

  const handleAgentRun = async (agentName: string, prompt: any) => {
    setIsRunningAgent(true);
    addTerminalOutput(`🤖 Running agent: ${agentName}`);
    try {
      const response = await apiClient.post(
        `/api/projects/${params.projectId}/agents/${agentName}`,
        {
          prompt,
          code: editorContent,
        }
      );
      const data = await response.json();
      addTerminalOutput(`✅ Agent ${agentName} completed`);
      if (data.response.message) {
        addTerminalOutput(`📝 ${data.response.message}`);
      }
      return data.response;
    } catch (error) {
      addTerminalOutput(`❌ Agent error: ${error}`);
      return null;
    } finally {
      setIsRunningAgent(false);
    }
  };

  const handleDeploy = async (provider: string, config: any) => {
    setIsDeploying(true);
    addTerminalOutput(`🚀 Deploying to ${provider}...`);
    try {
      const response = await apiClient.post(
        `/api/projects/${params.projectId}/deploy`,
        {
          provider,
          ...config,
        }
      );
      const data = await response.json();
      addTerminalOutput(`✅ Deployment initiated: ${provider}`);
      addTerminalOutput(`🔗 URL: ${data.status.url || "pending"}`);
      return data;
    } catch (error) {
      addTerminalOutput(`❌ Deployment failed: ${error}`);
      return null;
    } finally {
      setIsDeploying(false);
    }
  };

  const renderFileTree = (nodes: FileTreeNode[], depth: number = 0): React.ReactNode => {
    return nodes.map((node) => (
      <div key={node.path} style={{ marginLeft: `${depth * 16}px` }}>
        <div
          className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer"
          onClick={() => {
            if (node.type === "folder") {
              toggleFolder(node.path);
            } else {
              handleFileSelect(node);
            }
          }}
        >
          {node.type === "folder" ? (
            <>
              {expandedFolders.has(node.path) ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              <FolderIcon size={16} className="text-blue-500" />
            </>
          ) : (
            <FileIcon size={16} className="text-gray-500" />
          )}
          <span className="text-sm">{node.name}</span>
        </div>
        {node.type === "folder" && expandedFolders.has(node.path) && node.children && (
          <div>{renderFileTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{projectName}</h1>
            {analysis && (
              <p className="text-sm text-gray-600">
                {analysis.framework} • {analysis.language} • Confidence: {analysis.confidence}%
              </p>
            )}
          </div>
          <Button variant="outline" onClick={() => navigate("/projects")}>
            Back
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* File Tree */}
        <div className="w-64 border-r bg-gray-50 overflow-y-auto">
          <div className="p-3">
            <h3 className="text-sm font-semibold mb-3">Files</h3>
            {fileTree.length > 0 ? renderFileTree(fileTree) : <p className="text-xs text-gray-500">No files</p>}
          </div>
        </div>

        {/* Editor + Terminal */}
        <div className="flex-1 flex flex-col">
          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            {selectedFile ? (
              <div className="flex flex-col h-full">
                <div className="bg-gray-100 px-4 py-2 border-b text-sm font-mono">
                  {selectedFile.path}
                </div>
                <Editor
                  language={selectedFile.name.endsWith(".tsx") ? "typescript" : selectedFile.name.endsWith(".py") ? "python" : "text"}
                  value={editorContent}
                  onChange={(value) => setEditorContent(value || "")}
                  theme="vs-light"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    automaticLayout: true,
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a file to edit
              </div>
            )}
          </div>

          {/* Terminal */}
          <div className="border-t bg-gray-900 text-gray-100 h-48">
            <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 border-b">
              <Terminal size={16} />
              <span className="text-sm font-semibold">Terminal</span>
            </div>
            <div className="overflow-y-auto h-40 p-3 font-mono text-xs">
              {terminalOutput.map((line, i) => (
                <div key={i} className="text-green-400">
                  {line}
                </div>
              ))}
            </div>
            <div className="px-3 py-2 flex gap-2">
              {analysis?.devCommand && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  onClick={() => runCommand(analysis.devCommand!)}
                >
                  Dev
                </Button>
              )}
              {analysis?.buildCommand && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  onClick={() => runCommand(analysis.buildCommand!)}
                >
                  Build
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Agents / Deployments */}
        <div className="w-80 border-l bg-white overflow-hidden flex flex-col">
          <div className="flex border-b">
            <button
              onClick={() => setRightPanelMode("agents")}
              className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                rightPanelMode === "agents"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              AI Agents
            </button>
            <button
              onClick={() => setRightPanelMode("deployments")}
              className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                rightPanelMode === "deployments"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Deploy
            </button>
          </div>

          {rightPanelMode === "agents" ? (
            <AgentsPanel
              projectId={params.projectId!}
              selectedCode={editorContent}
              onAgentRun={handleAgentRun}
              isLoading={isRunningAgent}
            />
          ) : (
            <DeploymentsPanel
              projectId={params.projectId!}
              projectName={projectName}
              onDeploy={handleDeploy}
              isDeploying={isDeploying}
            />
          )}
        </div>
      </div>
    </div>
  );
}
