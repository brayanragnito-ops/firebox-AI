// @ts-nocheck
import { Router } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/auth";

const router = Router();
const configuration = [
  ["MONGODB_URI", "Platform database", "Accounts, projects, activity, and deployments"],
  ["JWT_SECRET", "Session security", "Encrypted signed-in sessions"],
  ["FIREBOX_PROJECTS_ROOT", "Workspace storage", "Persistent mounted storage for isolated project files"],
  ["OPENAI_API_KEY", "OpenAI agent", "Agent reasoning and tool calls"],
  ["GITHUB_CLIENT_ID", "GitHub OAuth", "Repository imports and source control"],
  ["GITHUB_CLIENT_SECRET", "GitHub OAuth", "Repository imports and source control"],
  ["GITHUB_CALLBACK_URL", "GitHub OAuth", "OAuth callback URL"],
  ["VERCEL_TOKEN", "Vercel deployment", "Real Vercel deployments"],
  ["RAILWAY_TOKEN", "Railway deployment", "Real Railway deployments"],
];
router.get("/admin/configuration", authMiddleware, (req: AuthenticatedRequest, res) => {
  const allowlist = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  if (allowlist.length && !allowlist.includes(req.user!.email.toLowerCase())) return res.status(403).json({ error: "Admin access required" });
  res.json(configuration.map(([variable, feature, description]) => ({ variable, feature, description, configured: Boolean(process.env[variable]) })));
});
export default router;
