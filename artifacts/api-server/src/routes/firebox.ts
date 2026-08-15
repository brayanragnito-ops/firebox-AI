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

const projects: Project[] = [
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

const activities: Activity[] = [
  { id: "activity-1", label: "Preview updated", detail: "Summit Commerce", status: "complete", timestamp: "2026-08-14T16:10:00.000Z" },
  { id: "activity-2", label: "Agent refactored cart state", detail: "Summit Commerce", status: "complete", timestamp: "2026-08-14T15:54:00.000Z" },
  { id: "activity-3", label: "Dependency scan complete", detail: "Orbit Analytics", status: "complete", timestamp: "2026-08-13T09:30:00.000Z" },
  { id: "activity-4", label: "Database connection needed", detail: "Atlas API", status: "failed", timestamp: "2026-08-10T12:00:00.000Z" },
];

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

const templates = [
  { id: "template-react", name: "React workspace", description: "A fast Vite foundation for polished product interfaces.", framework: "React + Vite", category: "Frontend", color: "#7c5cff" },
  { id: "template-next", name: "Next.js app", description: "Full-stack routing, server actions, and production-ready defaults.", framework: "Next.js", category: "Full-stack", color: "#1c1d25" },
  { id: "template-fastapi", name: "FastAPI service", description: "Typed Python API with a clean route and test structure.", framework: "FastAPI", category: "Backend", color: "#35b997" },
  { id: "template-node", name: "Node API", description: "A lightweight Express service ready for your own data layer.", framework: "Express", category: "Backend", color: "#f0a34a" },
];

const usage = {
  creditsUsed: 184,
  creditsTotal: 500,
  computeUsed: 42,
  computeTotal: 100,
  resetDate: "Sep 01, 2026",
};

const intelligenceByProject: Record<string, object> = {
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
};

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
  res.json(intelligenceByProject[parsed.data.projectId] ?? intelligenceByProject["proj-orbit"]);
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
  res.status(202).json(deployment);
});

/**
 * POST /api/projects
 * Create a new project
 */
router.post("/projects", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const parsed = CreateProjectBody.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { name, source, framework, prompt, repository } = parsed.data;

    // Perform initial analysis
    const analysis = analyzeProject(name, prompt, undefined);

    const project = await createProject({
      userId,
      name,
      source,
      repository,
      framework: framework || analysis.framework,
      description: prompt,
      status: source === "github" || source === "zip" ? "needs-setup" : "ready",
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      color: source === "github" ? "#1c1d25" : source === "zip" ? "#35b997" : "#7c5cff",
      language: analysis.language,
      runtime: analysis.runtime,
      packageManager: analysis.packageManager,
      buildTool: analysis.buildTool,
      devCommand: analysis.devCommand,
      buildCommand: analysis.buildCommand,
    });

    res.status(201).json({
      project,
      analysis: {
        ...analysis,
        confidence: Math.round(analysis.confidence),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create project";
    logger.error({ err: error as any }, "Create project error");
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/projects/:projectId
 * Get project details
 */
router.get("/projects/:projectId", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const project = await getProjectByUserAndId(userId, req.params.projectId as string);

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    res.json(project);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get project";
    logger.error({ err: error as any }, "Get project error");
    res.status(400).json({ error: message });
  }
});

/**
 * PUT /api/projects/:projectId
 * Update project
 */
router.put("/projects/:projectId", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const project = await getProjectByUserAndId(userId, req.params.projectId as string);

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const updated = await updateProject(req.params.projectId as string, req.body);
    res.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update project";
    logger.error({ err: error as any }, "Update project error");
    res.status(400).json({ error: message });
  }
});

/**
 * DELETE /api/projects/:projectId
 * Delete project
 */
router.delete("/projects/:projectId", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const project = await getProjectByUserAndId(userId, req.params.projectId as string);

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    await deleteProject(req.params.projectId as string);
    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete project";
    logger.error({ err: error as any }, "Delete project error");
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/projects/:projectId/analyze
 * Analyze project stack and detect framework/runtime
 */
router.post("/projects/:projectId/analyze", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const project = await getProjectByUserAndId(userId, req.params.projectId as string);

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Analyze the project based on its metadata and description
    const analysis = analyzeProject(
      project.name,
      project.description,
      req.body.packageJson || undefined
    );

    // Update project with analysis results
    const updated = await updateProject(req.params.projectId as string, {
      framework: analysis.framework,
      runtime: analysis.runtime,
      language: analysis.language,
      buildTool: analysis.buildTool,
      packageManager: analysis.packageManager,
      devCommand: analysis.devCommand,
      buildCommand: analysis.buildCommand,
      structure: JSON.stringify(analysis.structure),
    });

    res.json({
      project: updated,
      analysis: {
        ...analysis,
        confidence: Math.round(analysis.confidence),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze project";
    logger.error({ err: error as any }, "Analyze project error");
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/projects/:projectId/analyze
 * Get project analysis/intelligence
 */
router.get("/projects/:projectId/analyze", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const project = await getProjectByUserAndId(userId, req.params.projectId as string);

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Perform analysis and return results
    const analysis = analyzeProject(
      project.name,
      project.description,
      undefined
    );

    res.json({
      project: {
        id: project.id,
        name: project.name,
        framework: project.framework || analysis.framework,
        runtime: project.runtime || analysis.runtime,
        language: project.language,
        buildTool: project.buildTool || analysis.buildTool,
        packageManager: project.packageManager || analysis.packageManager,
        devCommand: project.devCommand || analysis.devCommand,
        buildCommand: project.buildCommand || analysis.buildCommand,
      },
      analysis,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get analysis";
    logger.error({ err: error as any }, "Get analysis error");
    res.status(400).json({ error: message });
  }
});

/**
router.get("/deployments", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const deployments = await getDeploymentsByUserId(userId);
    res.json(deployments);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get deployments";
    logger.error({ err: error as any }, "Get deployments error");
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/projects/:projectId/deployments
 * Create deployment for project
 */
router.post("/projects/:projectId/deployments", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const projectId = req.params.projectId as string;

    // Verify project belongs to user
    const project = await getProjectByUserAndId(userId, projectId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const parsed = CreateDeploymentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const deployment = await createDeployment({
      userId,
      projectId,
      provider: parsed.data.provider,
      status: "building",
    });

    res.status(201).json(deployment);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create deployment";
    logger.error({ err: error as any }, "Create deployment error");
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/projects/:projectId/agent-runs
 * Start agent run on project
 */
router.post("/projects/:projectId/agent-runs", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const projectId = req.params.projectId as string;

    // Verify project belongs to user
    const project = await getProjectByUserAndId(userId, projectId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const parsed = CreateAgentRunBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const run = await createAgentRun({
      userId,
      projectId,
      agent: "spark", // Default to Spark for now
      prompt: parsed.data.prompt,
      status: "running",
      activities: JSON.stringify([
        { type: "message", message: "Starting agent...", timestamp: new Date() }
      ]),
    });

    res.status(202).json(run);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start agent run";
    logger.error({ err: error as any }, "Agent run error");
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/projects/:projectId/activity
 * Get agent activity for project
 */
router.get("/projects/:projectId/activity", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const projectId = req.params.projectId as string;

    // Verify project belongs to user
    const project = await getProjectByUserAndId(userId, projectId);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const runs = await getAgentRunsByProjectId(projectId);
    res.json(runs);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get activity";
    logger.error({ err: error as any }, "Get activity error");
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/usage
 * Get user usage/credits
 */
router.get("/usage", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const usage = await getUserUsageByDate(userId, new Date());

    res.json({
      creditsUsed: usage?.costUSD || "0",
      creditsTotal: "500",
      computeUsed: usage?.computeMinutes || 0,
      computeTotal: "100",
      resetDate: "Sep 01, 2026",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get usage";
    logger.error({ err: error as any }, "Get usage error");
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/agents
 * List all available agents
 */
router.get("/agents", authMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const agents = listAgents();
    res.json({ agents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list agents";
    logger.error({ err: error as any }, "List agents error");
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/agents/:agentName/run
 * Execute an agent on a project
 */
router.post("/agents/:agentName/run", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const { agentName } = req.params;
    const { projectId, prompt } = req.body;

    // Verify project belongs to user
    const project = await getProjectByUserAndId(userId, projectId as string);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Verify agent exists
    const agent = getAgent(agentName as string);
    if (!agent) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }

    // Execute agent
    const agentPrompt: AgentPrompt = {
      type: prompt?.type || "analyze",
      content: prompt?.content || "Analyze this code",
      context: {
        filePath: prompt?.filePath,
        selectedCode: prompt?.selectedCode,
        projectFramework: project.framework || undefined,
        language: project.language || undefined,
      },
    };

    const response = await executeAgent(agentName as string, agentPrompt);

    // Record agent run
    const run = await createAgentRun({
      userId,
      projectId,
      agent: agentName as string,
      prompt: prompt?.content || "User request",
      status: "completed",
      activities: JSON.stringify([
        createActivityLog(agent.name, response),
      ]),
    });

    res.json({
      run,
      response,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run agent";
    logger.error({ err: error as any }, "Agent run error");
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/projects/:projectId/agents/:agentName
 * Run agent on specific project
 */
router.post("/projects/:projectId/agents/:agentName", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const { projectId, agentName } = req.params;
    const { prompt, code } = req.body;

    // Verify project belongs to user
    const project = await getProjectByUserAndId(userId, projectId as string);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Verify agent exists
    const agent = getAgent(agentName as string);
    if (!agent) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }

    // Execute agent
    const agentPrompt: AgentPrompt = {
      type: (prompt?.type as any) || "analyze",
      content: prompt?.content || code || "Analyze this code",
      context: {
        projectFramework: project.framework || undefined,
        language: project.language || undefined,
      },
    };

    const response = await executeAgent(agentName as string, agentPrompt);

    // Record agent run
    await createAgentRun({
      userId,
      projectId,
      agent: agentName as string,
      prompt: prompt?.content || code || "User request",
      status: "completed",
      activities: JSON.stringify([
        createActivityLog(agent.name, response),
      ]),
    });

    res.json({
      run: await createAgentRun({
        userId,
        projectId,
        agent: agentName as string,
        prompt: prompt?.content || code || "User request",
        status: "completed",
        activities: JSON.stringify([
          createActivityLog(agent.name, response),
        ]),
      }),
      response,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run agent";
    logger.error({ err: error as any }, "Agent run error");
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/deployment-providers
 * List all available deployment providers
 */
router.get("/deployment-providers", authMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const providers = listProviders();
    res.json({ providers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list providers";
    logger.error({ err: error as any }, "List providers error");
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/projects/:projectId/deploy
 * Deploy project to specified provider
 */
router.post("/projects/:projectId/deploy", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const { projectId } = req.params;
    const { provider, branch, region, environment: envVars } = req.body;

    // Verify project belongs to user
    const project = await getProjectByUserAndId(userId, projectId as string);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Create deployment config
    const config: DeploymentConfig = {
      provider,
      projectName: project.name,
      branch: branch || "main",
      region,
      buildCommand: project.buildCommand || undefined,
      startCommand: project.startCommand || undefined,
      environment: envVars,
    };

    // Execute deployment
    const status = await deployProject(projectId as string, project.name, config);

    // Record deployment
    const deployment = await createDeployment({
      userId,
      projectId,
      provider,
      status: status.status as any,
      url: status.url,
      environment: JSON.stringify(envVars || {}),
    });

    res.status(202).json({
      deployment,
      status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to deploy";
    logger.error({ err: error as any }, "Deployment error");
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/projects/:projectId/deployments
 * Get deployment history for project
 */
router.get("/projects/:projectId/deployments", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const { projectId } = req.params;

    // Verify project belongs to user
    const project = await getProjectByUserAndId(userId, projectId as string);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const deployments = await getDeploymentsByProjectId(projectId as string);
    const history = getDeploymentHistory(projectId as string);

    res.json({
      deployments,
      history,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get deployments";
    logger.error({ err: error as any }, "Get deployments error");
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/projects/:projectId/rollback/:deploymentId
 * Rollback to previous deployment
 */
router.post("/projects/:projectId/rollback/:deploymentId", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const { projectId, deploymentId } = req.params;

    // Verify project belongs to user
    const project = await getProjectByUserAndId(userId, projectId as string);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Execute rollback
    const status = await rollbackDeployment(projectId as string, deploymentId as string);

    res.json({
      status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to rollback";
    logger.error({ err: error as any }, "Rollback error");
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/projects/:projectId/env
 * Get environment variables for project
 */
router.get("/projects/:projectId/env", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const { projectId } = req.params;
    const scope = Array.isArray(req.query.scope)
      ? req.query.scope[0]
      : (req.query.scope as string | undefined) || "production";

    // Verify project belongs to user
    const project = await getProjectByUserAndId(userId, projectId as string);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const variables = getEnvironmentVariables(projectId as string, scope as any);
    res.json({ variables });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get environment variables";
    logger.error({ err: error as any }, "Get env error");
    res.status(400).json({ error: message });
  }
});

/**
 * PUT /api/projects/:projectId/env/:key
 * Update environment variable
 */
router.put("/projects/:projectId/env/:key", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const { projectId, key } = req.params;
    const { value, scope } = req.body;

    // Verify project belongs to user
    const project = await getProjectByUserAndId(userId, projectId as string);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const success = await updateEnvironmentVariable(projectId as string, {
      key,
      value,
      encrypted: true,
      scope: scope || "production",
    });

    res.json({ success });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update environment variable";
    logger.error({ err: error as any }, "Update env error");
    res.status(400).json({ error: message });
  }
});

/**
 * DELETE /api/projects/:projectId/env/:key
 * Delete environment variable
 */
router.delete("/projects/:projectId/env/:key", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const { projectId, key } = req.params;

    // Verify project belongs to user
    const project = await getProjectByUserAndId(userId, projectId as string);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const success = await deleteEnvironmentVariable(projectId as string, key as string);
    res.json({ success });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete environment variable";
    logger.error({ err: error as any }, "Delete env error");
    res.status(400).json({ error: message });
  }
});

export default router;
