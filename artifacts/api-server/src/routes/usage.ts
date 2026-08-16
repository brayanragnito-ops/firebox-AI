import { Router } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/auth";
import { getUsageSummary } from "../services/usage";

const router = Router();
router.get("/usage", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    res.json(await getUsageSummary(req.user!.id));
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : "Usage is unavailable" });
  }
});
export default router;
