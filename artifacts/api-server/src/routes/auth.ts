import { Router, type IRouter, type Response } from "express";
import { signup, login, getCurrentUser } from "../services/auth";
import { getUserById } from "../services/db";
import { authMiddleware, type AuthenticatedRequest, assertAuthenticated } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * POST /api/auth/signup
 * Create a new user account
 */
router.post("/signup", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, name, password } = req.body;

    const result = await signup({ email, name, password });
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed";
    logger.error({ err: error }, "Signup error");
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post("/login", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await login({ email, password });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    logger.error({ err: error }, "Login error");
    res.status(401).json({ error: message });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get("/me", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const user = await getUserById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      avatar: user.avatar,
      gitHubConnected: user.gitHubConnected,
      creditsRemaining: user.credits,
      creditsResetDate: user.creditsResetDate,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get user";
    logger.error({ err: error }, "Get current user error");
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (token is invalidated on client)
 */
router.post("/logout", authMiddleware, (_req: AuthenticatedRequest, res: Response) => {
  // JWT is stateless, so logout is handled client-side by removing token
  // This endpoint is here for symmetry and future use (e.g., token blacklist)
  res.json({ success: true });
});

/**
 * PUT /api/auth/profile
 * Update current user profile
 */
router.put("/profile", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const { name, avatar } = req.body;

    if (!name && !avatar) {
      res.status(400).json({ error: "At least one field is required" });
      return;
    }

    const { updateUser } = await import("../services/db");
    const user = await updateUser(userId, { name, avatar });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    logger.error({ err: error as any }, "Profile update error");
    res.status(400).json({ error: message });
  }
});

export default router;
