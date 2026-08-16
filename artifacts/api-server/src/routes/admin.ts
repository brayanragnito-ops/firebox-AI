import { Router } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/auth";
import { getAdminSettings, publicAdminSettings, updateAdminSettings } from "../services/admin-settings";

const router = Router();
const configuration = [
  ["MONGODB_URI", "Platform database", "Accounts, projects, activity, and deployments"],
  ["JWT_SECRET", "Session security", "Signed-in session security"],
  ["FIREBOX_PROJECTS_ROOT", "Workspace storage", "Persistent isolated project files"],
  ["OPENAI_API_KEY", "AI provider", "Backend-only agent reasoning; never editable here"],
  ["GITHUB_CLIENT_ID", "GitHub OAuth", "Backend-only repository connection; status only"],
  ["GITHUB_CLIENT_SECRET", "GitHub OAuth", "Backend-only repository connection; status only"],
  ["GITHUB_CALLBACK_URL", "GitHub OAuth", "OAuth callback URL"],
  ["VERCEL_DEPLOY_HOOK_URL", "Vercel deployment", "Backend deployment hook; status only"],
  ["RAILWAY_DEPLOY_HOOK_URL", "Railway deployment", "Backend deployment hook; status only"],
  ["RENDER_DEPLOY_HOOK_URL", "Render deployment", "Backend deployment hook; status only"],
];
function requireAdmin(req: AuthenticatedRequest, res: import("express").Response) { const allowlist = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean); if (allowlist.length && !allowlist.includes(req.user!.email.toLowerCase())) { res.status(403).json({ error: "Admin access required" }); return false; } return true; }
router.get("/admin/configuration", authMiddleware, async (req: AuthenticatedRequest, res) => { if (!requireAdmin(req, res)) return; const settings = await getAdminSettings(); res.json({ secrets: configuration.map(([variable, feature, description]) => ({ variable, feature, description, configured: Boolean(process.env[variable]) })), providers: publicAdminSettings(settings) }); });
router.patch("/admin/providers", authMiddleware, async (req: AuthenticatedRequest, res) => { if (!requireAdmin(req, res)) return; const body = req.body ?? {}; const deployments = body.deployments && typeof body.deployments === "object" ? { vercel: Boolean(body.deployments.vercel), railway: Boolean(body.deployments.railway), render: Boolean(body.deployments.render) } : undefined; const github = body.github && typeof body.github === "object" ? { enabled: Boolean(body.github.enabled) } : undefined; const authentication = body.authentication && typeof body.authentication === "object" ? { registrationEnabled: Boolean(body.authentication.registrationEnabled) } : undefined; const settings = await updateAdminSettings(req.user!.id, { deployments, github, authentication }); res.json(publicAdminSettings(settings)); });
router.get("/admin/providers", authMiddleware, async (req: AuthenticatedRequest, res) => { if (!requireAdmin(req, res)) return; res.json(publicAdminSettings(await getAdminSettings())); });
export default router;
