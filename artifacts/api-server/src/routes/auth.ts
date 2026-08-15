// @ts-nocheck
import { Router } from "express";
import { randomUUID } from "node:crypto";
import { authMiddleware, clearSession, hashPassword, setSession, type AuthenticatedRequest, verifyPassword } from "../middlewares/auth";
import { users } from "../services/mongo";

const router = Router();
router.post("/auth/register", async (req, res) => { if (!process.env.JWT_SECRET) return res.status(503).json({ error: "Authentication is not configured. Add JWT_SECRET to deployment variables." }); const { email, password, name } = req.body ?? {}; if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== "string" || password.length < 8) return res.status(400).json({ error: "A valid email and password of at least 8 characters are required" }); const collection = await users(); if (await collection.findOne({ email: email.toLowerCase() })) return res.status(409).json({ error: "An account already exists for this email" }); const user = { _id: randomUUID(), email: email.toLowerCase(), name: typeof name === "string" && name.trim() ? name.trim() : email.split("@")[0], passwordHash: hashPassword(password), createdAt: new Date() }; await collection.insertOne(user); setSession(res, { id: user._id, email: user.email, name: user.name }); res.status(201).json({ id: user._id, email: user.email, name: user.name }); });
router.post("/auth/login", async (req, res) => { if (!process.env.JWT_SECRET) return res.status(503).json({ error: "Authentication is not configured. Add JWT_SECRET to deployment variables." }); const { email, password } = req.body ?? {}; const user = typeof email === "string" ? await (await users()).findOne({ email: email.toLowerCase() }) : null; if (!user || typeof password !== "string" || !verifyPassword(password, user.passwordHash)) return res.status(401).json({ error: "Invalid email or password" }); setSession(res, { id: user._id, email: user.email, name: user.name }); res.json({ id: user._id, email: user.email, name: user.name }); });
router.post("/auth/logout", (_req, res) => { clearSession(res); res.status(204).end(); });
router.get("/auth/me", authMiddleware, (req: AuthenticatedRequest, res) => res.json(req.user));
export default router;
