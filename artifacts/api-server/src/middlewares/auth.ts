import { type Request, type Response, type NextFunction } from "express";
import { verifyToken, extractBearerToken } from "../lib/jwt";
import { logger } from "../lib/logger";

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Authentication middleware - validates JWT token
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({ error: "Missing authentication token" });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    req.userId = payload.userId;
    req.userEmail = payload.email;
    req.user = { id: payload.userId, email: payload.email };

    logger.debug(`Authenticated user: ${payload.userId}`);
    next();
  } catch (error) {
    logger.error({ err: error as any }, "Auth middleware error");
    res.status(401).json({ error: "Authentication failed" });
  }
}

/**
 * Optional auth middleware - doesn't fail if no token
 */
export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        req.userId = payload.userId;
        req.userEmail = payload.email;
        req.user = { id: payload.userId, email: payload.email };
      }
    }
  } catch (error) {
    logger.debug("Optional auth failed, continuing without auth");
  }
  next();
}

/**
 * Assert that user is authenticated
 */
export function assertAuthenticated(req: AuthenticatedRequest): string {
  if (!req.userId) {
    throw new Error("User not authenticated");
  }
  return req.userId;
}

export const optionalAuth = optionalAuthMiddleware;
export const auth = authMiddleware;
