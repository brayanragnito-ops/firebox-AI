import type { NextFunction, Request, Response } from "express";

export type AuthUser = {
  id: string;
  email?: string;
  role?: string;
};

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  const rawUserId =
    typeof req.headers.authorization === "string"
      ? req.headers.authorization.replace(/^Bearer\s+/i, "")
      : typeof req.headers["x-user-id"] === "string"
        ? req.headers["x-user-id"]
        : Array.isArray(req.headers["x-user-id"])
          ? req.headers["x-user-id"][0]
          : undefined;

  req.user = {
    id: rawUserId || "local-user",
  };

  next();
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  req.user = req.user ?? { id: "local-user" };
  next();
};

export function assertAuthenticated(req: AuthenticatedRequest): string {
  if (!req.user?.id) {
    throw new Error("Authentication required");
  }

  return req.user.id;
}
