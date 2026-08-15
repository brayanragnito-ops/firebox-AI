// @ts-nocheck
import { Router, type IRouter } from "express";
import {
  CreateAgentRunBody,
  CreateAgentRunParams,
  CreateDeploymentBody,
  CreateDeploymentParams,
  CreateProjectBody,
  GetProjectActivityParams,
  GetProjectIntelligenceParams,
} from "@workspace/api-zod";

type Project = {
  id: string;
  name: string;
  slug: string;
  source: "prompt" | "github" | "zip";
  framework: string;
  runtime?: string;
  status: "ready" | "running" | "needs-setup" | "deploying";
  updatedAt: string;
  color: string;
  description: string | null;
  repository: string | null;
};

type Activity = {
  id: string;
  label: string;
  detail: string | null;
  status: "complete" | "active" | "queued" | "failed";
  timestamp: string;
};

type Deployment = {
  id: string;
  projectId: string;
  projectName: string;
  provider: string;
  status: "live" | "building" | "failed" | "paused";
  url: string | null;
  createdAt: string;
};

/* const projects: Project[] = [
  {
    id: "proj-summit",
    name: "Summit Commerce",
    slug: "summit-commerce",
    source: "github",
    framework: "Next.js",
    runtime: "Node.js 20",
    status: "running",
    updatedAt: "2026-08-14T16:10:00.000Z",
    color: "#7c5cff",
    description: "A headless commerce storefront with a clean checkout flow.",
    repository: "github.com/ava/summit-commerce",
  },
  {
    id: "proj-orbit",
    name: "Orbit Analytics",
    slug: "orbit-analytics",
    source: "prompt",
    framework: "React + Vite",
    runtime: "Node.js 20",
    status: "ready",
    updatedAt: "2026-08-13T09:30:00.000Z",
    color: "#f0a34a",
    description: "An internal analytics workspace for product teams.",
    repository: null,
  },
  {
    id: "proj-atlas",
    name: "Atlas API",
    slug: "atlas-api",
    source: "zip",
    framework: "FastAPI",
    runtime: "Python 3.12",
    status: "needs-setup",
    updatedAt: "2026-08-10T12:00:00.000Z",
    color: "#35b997",
    description: "A Python API imported from a local archive.",
    repository: null,
  },
];

const projects: Project[] = [];
const activities: Activity[] = [
  { id: "activity-1", label: "Preview updated", detail: "Summit Commerce", status: "complete", timestamp: "2026-08-14T16:10:00.000Z" },
  { id: "activity-2", label: "Agent refactored cart state", detail: "Summit Commerce", status: "complete", timestamp: "2026-08-14T15:54:00.000Z" },
  { id: "activity-3", label: "Dependency scan complete", detail: "Orbit Analytics", status: "complete", timestamp: "2026-08-13T09:30:00.000Z" },
  { id: "activity-4", label: "Database connection needed", detail: "Atlas API", status: "failed", timestamp: "2026-08-10T12:00:00.000Z" },
];

const activities: Activity[] = [];
const deployments: Deployment[] = [
  {
    id: "deployment-1",
    projectId: "proj-summit",
    projectName: "Summit Commerce",
    provider: "Vercel",
    status: "live",
    url: "summit-commerce.vercel.app",
    createdAt: "2026-08-14T10:42:00.000Z",
  },
  {
    id: "deployment-2",
    projectId: "proj-orbit",
    projectName: "Orbit Analytics",
    provider: "Railway",
    status: "building",
    url: null,
    createdAt: "2026-08-13T16:18:00.000Z",
  },
];

const deployments: Deployment[] = [];
*/

// The workspace is intentionally empty until the user creates real work.
const projects: Project[] = [];
const activities: Activity[] = [];
const deployments: Deployment[] = [];

const templates = [
  { id: "template-react", name: "React workspace", description: "A fast Vite foundation for polished product interfaces.", framework: "React + Vite", category: "Frontend", color: "#7c5cff" },
  { id: "template-next", name: "Next.js app", description: "Full-stack routing, server actions, and production-ready defaults.", framework: "Next.js", category: "Full-stack", color: "#1c1d25" },
  { id: "template-fastapi", name: "FastAPI service", description: "Typed Python API with a clean route and test structure.", framework: "FastAPI", category: "Backend", color: "#35b997" },
  { id: "template-node", name: "Node API", description: "A lightweight Express service ready for your own data layer.", framework: "Express", category: "Backend", color: "#f0a34a" },
];

const usage = {
  creditsUsed: 0,
  creditsTotal: 0,
  computeUsed: 0,
  computeTotal: 0,
  resetDate: new Date().toISOString(),
};

/* const intelligenceByProject: Record<string, object> = {
  "proj-summit": {
    language: "TypeScript",
    framework: "Next.js",
    runtime: "Node.js 20",
    packageManager: "pnpm",
    buildTool: "Turbopack",
    devCommand: "pnpm dev",
    buildCommand: "pnpm build",
    confidence: 98,
    structure: ["app/", "components/", "lib/", "public/", "package.json"],
    database: "PostgreSQL",
  },
  "proj-orbit": {
    language: "TypeScript",
    framework: "React + Vite",
    runtime: "Node.js 20",
    packageManager: "npm",
    buildTool: "Vite",
    devCommand: "npm run dev",
    buildCommand: "npm run build",
    confidence: 96,
    structure: ["src/", "src/components/", "public/", "vite.config.ts", "package.json"],
    database: null,
  },
  "proj-atlas": {
    language: "Python",
    framework: "FastAPI",
    runtime: "Python 3.12",
    packageManager: "pip",
    buildTool: "uvicorn",
    devCommand: "uvicorn app:app --reload",
    buildCommand: "python -m compileall .",
    confidence: 89,
    structure: ["app/", "tests/", "requirements.txt", "README.md"],
    database: null,
  },
}; */
const intelligenceByProject: Record<string, object> = {};

const router: IRouter = Router();

router.get("/dashboard", (_req, res) => {
  res.json({
    projects: projects.length,
    deployments: deployments.length,
    activeRuns: 1,
    recentActivity: activities,
    usage,
  });
});

router.get("/projects", (_req, res) => {
  res.json(projects);
});

router.post("/projects", (req, res) => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const source = parsed.data.source;
  const framework = parsed.data.framework ?? (source === "github" ? "Detecting stack" : "React + Vite");
  const project: Project = {
    id: `proj-${Date.now()}`,
    name: parsed.data.name,
    slug: parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    source,
    framework,
    runtime: source === "zip" ? "Detecting runtime" : "Node.js 20",
    status: source === "zip" || source === "github" ? "needs-setup" : "ready",
    updatedAt: "Just now",
    color: source === "github" ? "#1c1d25" : source === "zip" ? "#35b997" : "#7c5cff",
    description: parsed.data.prompt ?? "A new Firebox AI project.",
    repository: parsed.data.repository ?? null,
  };
  projects.unshift(project);
  activities.unshift({
    id: `activity-${Date.now()}`,
    label: "Project created",
    detail: project.name,
    status: "complete",
    timestamp: new Date().toISOString(),
  });
  res.status(201).json(project);
});

router.get("/projects/:projectId", (req, res) => {
  const project = projects.find((item) => item.id === req.params.projectId);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(project);
});

router.get("/projects/:projectId/intelligence", (req, res) => {
  const parsed = GetProjectIntelligenceParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const intelligence = intelligenceByProject[parsed.data.projectId];
  if (!intelligence) {
    res.status(404).json({ error: "Project intelligence is not available yet" });
    return;
  }
  res.json(intelligence);
});

router.get("/projects/:projectId/activity", (req, res) => {
  const parsed = GetProjectActivityParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const project = projects.find((item) => item.id === parsed.data.projectId);
  res.json(project ? activities.filter((item) => item.detail === project.name) : []);
});

router.post("/projects/:projectId/agent-runs", (req, res) => {
  const params = CreateAgentRunParams.safeParse(req.params);
  const body = CreateAgentRunBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "A project and prompt are required." });
    return;
  }
  const project = projects.find((item) => item.id === params.data.projectId);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  project.status = "running";
  activities.unshift({
    id: `activity-${Date.now()}`,
    label: "Agent run started",
    detail: project.name,
    status: "active",
    timestamp: new Date().toISOString(),
  });
  res.status(202).json({
    id: `run-${Date.now()}`,
    prompt: body.data.prompt,
    status: "running",
    currentOperation: "Analyzing project",
  });
});

router.get("/templates", (_req, res) => {
  res.json(templates);
});

router.get("/deployments", (_req, res) => {
  res.json(deployments);
});

router.post("/projects/:projectId/deployments", (req, res) => {
  const params = CreateDeploymentParams.safeParse(req.params);
  const body = CreateDeploymentBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "A project and deployment provider are required." });
    return;
  }
  const project = projects.find((item) => item.id === params.data.projectId);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  project.status = "deploying";
  const deployment: Deployment = {
    id: `deployment-${Date.now()}`,
    projectId: project.id,
    projectName: project.name,
    provider: body.data.provider,
    status: "building",
    url: null,
    createdAt: "Just now",
  };
  deployments.unshift(deployment);
  activities.unshift({
    id: `activity-${Date.now()}`,
    label: "Deployment started",
    detail: project.name,
    status: "active",
    timestamp: new Date().toISOString(),
  });
  res.status(202).json(deployment);
});

export default router;
