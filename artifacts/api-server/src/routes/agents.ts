// @ts-nocheck
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { agentCatalog, getProviderStatus } from "../agents/runtime";

const router = Router();
router.get("/agents", authMiddleware, (_req, res) => {
  const providers = getProviderStatus();
  res.json(Object.entries(agentCatalog).map(([id, agent]) => ({ id, provider: agent.provider, role: agent.role, configured: providers[agent.provider].configured, available: false })));
});
export default router;
