// @ts-nocheck
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export type AuthenticatedRequest = Request & { user?: { id: string; email: string; name: string } };
const cookieName = "firebox_session";
const b64 = (value: string | Buffer) => Buffer.from(value).toString("base64url");
const secret = () => { if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured"); return process.env.JWT_SECRET; };
export function hashPassword(password: string) { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`; }
export function verifyPassword(password: string, stored: string) { const [salt, hash] = stored.split(":"); const derived = scryptSync(password, salt, 64); return timingSafeEqual(derived, Buffer.from(hash, "hex")); }
export function signSession(user: { id: string; email: string; name: string }) { const payload = b64(JSON.stringify({ ...user, exp: Date.now() + 7 * 86400000 })); return `${payload}.${createHmac("sha256", secret()).update(payload).digest("base64url")}`; }
function readSession(token?: string) { if (!token) return undefined; const [payload, signature] = token.split("."); if (!payload || !signature) return undefined; const expected = createHmac("sha256", secret()).update(payload).digest("base64url"); if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return undefined; const user = JSON.parse(Buffer.from(payload, "base64url").toString()); return user.exp > Date.now() ? { id: user.id, email: user.email, name: user.name } : undefined; }
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) { try { req.user = readSession(req.cookies?.[cookieName] ?? req.header("authorization")?.replace(/^Bearer\s+/i, "")); if (!req.user) return res.status(401).json({ error: "Authentication required" }); next(); } catch { res.status(401).json({ error: "Invalid session" }); } }
export function setSession(res: Response, user: { id: string; email: string; name: string }) { res.cookie(cookieName, signSession(user), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 7 * 86400000, path: "/" }); }
export function clearSession(res: Response) { res.clearCookie(cookieName, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" }); }
