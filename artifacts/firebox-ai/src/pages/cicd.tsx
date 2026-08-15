import { useState, useEffect } from "react";
import { GitBranch, Play, Clock, CheckCircle2, XCircle, AlertCircle, Zap, Code2, Terminal } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

interface CicdRun {
  id: string;
  workflowName: string;
  status: "pending" | "running" | "success" | "failed" | "cancelled";
  conclusion?: string;
  branch: string;
  commitSha: string;
  commitMessage?: string;
  commitAuthor?: string;
  runNumber: number;
  durationSeconds?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

interface CicdStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  cancelledRuns: number;
  avgDuration: number;
  successRate: string;
  lastRun?: CicdRun;
}

export default function CicdPage() {
  const [selectedProject, setSelectedProject] = useState<string>("project-1");
  const [runs, setRuns] = useState<CicdRun[]>([]);
  const [stats, setStats] = useState<CicdStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [triggerWorkflow, setTriggerWorkflow] = useState(false);

  // Mock projects
  const mockProjects = [
    { id: "project-1", name: "Firebox AI", framework: "Next.js" },
    { id: "project-2", name: "API Server", framework: "Express" },
    { id: "project-3", name: "Mobile App", framework: "React Native" },
  ];

  // Mock workflow runs data
  const mockRuns: CicdRun[] = [
    {
      id: "run-1",
      workflowName: "Deploy",
      status: "success",
      conclusion: "success",
      branch: "main",
      commitSha: "a1b2c3d4",
      commitMessage: "feat: Add monitoring dashboard",
      commitAuthor: "john.dev",
      runNumber: 145,
      durationSeconds: 342,
      startedAt: new Date(Date.now() - 30 * 60000).toISOString(),
      completedAt: new Date(Date.now() - 24 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    },
    {
      id: "run-2",
      workflowName: "Test",
      status: "success",
      conclusion: "success",
      branch: "feature/auth",
      commitSha: "e5f6g7h8",
      commitMessage: "fix: JWT refresh token timing",
      commitAuthor: "alice.dev",
      runNumber: 144,
      durationSeconds: 285,
      startedAt: new Date(Date.now() - 90 * 60000).toISOString(),
      completedAt: new Date(Date.now() - 85 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
    },
    {
      id: "run-3",
      workflowName: "Deploy",
      status: "failed",
      conclusion: "failure",
      branch: "develop",
      commitSha: "i9j0k1l2",
      commitMessage: "test: Add integration tests",
      commitAuthor: "bob.dev",
      runNumber: 143,
      durationSeconds: 523,
      startedAt: new Date(Date.now() - 150 * 60000).toISOString(),
      completedAt: new Date(Date.now() - 141 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 150 * 60000).toISOString(),
    },
    {
      id: "run-4",
      workflowName: "Build",
      status: "running",
      branch: "main",
      commitSha: "m3n4o5p6",
      commitMessage: "chore: Update dependencies",
      commitAuthor: "carol.dev",
      runNumber: 142,
      createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: "run-5",
      workflowName: "Test",
      status: "success",
      conclusion: "success",
      branch: "main",
      commitSha: "q7r8s9t0",
      commitMessage: "docs: Update README",
      commitAuthor: "dave.dev",
      runNumber: 141,
      durationSeconds: 198,
      startedAt: new Date(Date.now() - 300 * 60000).toISOString(),
      completedAt: new Date(Date.now() - 293 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 300 * 60000).toISOString(),
    },
  ];

  useEffect(() => {
    loadCicdData();
  }, [selectedProject]);

  const loadCicdData = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setRuns(mockRuns);
      setStats({
        totalRuns: 145,
        successfulRuns: 127,
        failedRuns: 12,
        cancelledRuns: 6,
        avgDuration: 312,
        successRate: "87.6%",
        lastRun: mockRuns[0],
      });
      setLoading(false);
    }, 500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "running":
        return <Zap className="w-5 h-5 text-blue-600 animate-pulse" />;
      case "pending":
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case "cancelled":
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-emerald-100 text-emerald-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "running":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "cancelled":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredRuns =
    selectedBranch === "all" ? runs : runs.filter((run) => run.branch === selectedBranch);

  const branches = Array.from(new Set(runs.map((run) => run.branch)));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Code2 size={32} />
            CI/CD Pipeline
          </h1>
          <p className="text-gray-600">Automated builds, tests, and deployments</p>
        </div>

        {/* Project Selector */}
        <div className="mb-8 flex gap-2">
          {mockProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project.id)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                selectedProject === project.id
                  ? "border-blue-600 bg-blue-50 text-blue-900 font-medium"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              {project.name}
              <span className="ml-2 text-xs opacity-75">({project.framework})</span>
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mb-8">
            <Card className="p-4">
              <div className="text-xs text-gray-600 mb-1">Total Runs</div>
              <div className="text-2xl font-bold">{stats.totalRuns}</div>
            </Card>
            <Card className="p-4 border-emerald-200 bg-emerald-50">
              <div className="text-xs text-emerald-600 mb-1">✓ Successful</div>
              <div className="text-2xl font-bold text-emerald-700">{stats.successfulRuns}</div>
            </Card>
            <Card className="p-4 border-red-200 bg-red-50">
              <div className="text-xs text-red-600 mb-1">✗ Failed</div>
              <div className="text-2xl font-bold text-red-700">{stats.failedRuns}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-600 mb-1">Avg Duration</div>
              <div className="text-2xl font-bold">{(stats.avgDuration / 60).toFixed(0)}m</div>
            </Card>
            <Card className="p-4 border-blue-200 bg-blue-50">
              <div className="text-xs text-blue-600 mb-1">Success Rate</div>
              <div className="text-2xl font-bold text-blue-700">{stats.successRate}</div>
            </Card>
          </div>
        )}

        {/* Workflow Trigger */}
        <Card className="p-6 mb-8 border border-blue-200 bg-blue-50">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Play size={18} />
            Trigger Workflow
          </h3>
          <div className="flex gap-3">
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>Deploy</option>
              <option>Test</option>
              <option>Build</option>
              <option>Release</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg">
              <option>main</option>
              <option>develop</option>
              <option>feature/auth</option>
            </select>
            <Button
              onClick={() => setTriggerWorkflow(!triggerWorkflow)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Zap size={16} className="mr-2" />
              Trigger Now
            </Button>
          </div>
        </Card>

        {/* Branch Filter */}
        <div className="mb-6 flex items-center gap-3">
          <GitBranch size={18} className="text-gray-600" />
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Branches</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">
            Showing {filteredRuns.length} of {runs.length} runs
          </span>
        </div>

        {/* Workflow Runs List */}
        <Card>
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Workflow</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Commit</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Branch</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Author</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Duration</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredRuns.map((run) => (
                  <tr key={run.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium">{run.workflowName}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(run.status)}
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${getStatusBadgeColor(
                            run.status
                          )}`}
                        >
                          {run.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {run.commitSha.substring(0, 7)}
                      </code>
                      <div className="text-xs text-gray-500 mt-1">{run.commitMessage}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="inline-block bg-gray-100 px-2 py-1 rounded text-xs">
                        {run.branch}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{run.commitAuthor || "—"}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {run.durationSeconds
                        ? `${(run.durationSeconds / 60).toFixed(1)}m`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(run.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Activity */}
        <div className="mt-8 grid grid-cols-2 gap-6">
          {/* Latest Run */}
          {stats?.lastRun && (
            <Card className="p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Terminal size={18} />
                Latest Run
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide">Workflow</div>
                  <div className="font-semibold">{stats.lastRun.workflowName}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide">Status</div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(stats.lastRun.status)}
                    <span className="font-semibold capitalize">{stats.lastRun.status}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide">Duration</div>
                  <div className="font-semibold">
                    {stats.lastRun.durationSeconds
                      ? `${(stats.lastRun.durationSeconds / 60).toFixed(1)} minutes`
                      : "In progress"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide">Commit</div>
                  <div className="text-sm text-gray-700">
                    {stats.lastRun.commitMessage || "No message"}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* GitHub Webhooks */}
          <Card className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Zap size={18} />
              GitHub Integration
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-deploy enabled</span>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Webhook active</span>
                <div className="w-2 h-2 bg-emerald-600 rounded-full" />
              </div>
              <div>
                <div className="text-xs text-gray-600 uppercase tracking-wide mb-2">
                  Deploy on branches
                </div>
                <div className="flex flex-wrap gap-2">
                  {["main", "develop"].map((branch) => (
                    <span key={branch} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {branch}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
