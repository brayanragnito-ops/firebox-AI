// @ts-nocheck
import { Router } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/auth";
import { projects } from "../services/mongo";
import { analyzeWorkspace, ensureWorkspace, listWorkspace, readWorkspaceFile, writeWorkspaceFile } from "../services/workspace";

const router = Router(); router.use(authMiddleware);
async function owned(req: AuthenticatedRequest) { const project = await (await projects()).findOne({ _id: req.params.projectId, userId: req.user!.id }); if (!project) throw new Error("Project not found"); return project; }
router.post("/projects/:projectId/workspace", async (req: AuthenticatedRequest, res) => { try { await owned(req); await ensureWorkspace(req.user!.id, req.params.projectId); res.status(201).json({ ready: true }); } catch (error) { res.status(error instanceof Error && error.message === "Project not found" ? 404 : 503).json({ error: error instanceof Error ? error.message : "Workspace unavailable" }); } });
router.get("/projects/:projectId/files", async (req: AuthenticatedRequest, res) => { try { await owned(req); res.json(await listWorkspace(req.user!.id, req.params.projectId, String(req.query.path ?? ""))); } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "Could not list files" }); } });
router.get("/projects/:projectId/files/content", async (req: AuthenticatedRequest, res) => { try { await owned(req); res.json({ content: await readWorkspaceFile(req.user!.id, req.params.projectId, String(req.query.path ?? "")) }); } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "Could not read file" }); } });
router.put("/projects/:projectId/files/content", async (req: AuthenticatedRequest, res) => { try { await owned(req); if (typeof req.body?.path !== "string" || typeof req.body?.content !== "string") return res.status(400).json({ error: "path and content are required" }); await writeWorkspaceFile(req.user!.id, req.params.projectId, req.body.path, req.body.content); res.status(204).end(); } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "Could not write file" }); } });
router.post("/projects/:projectId/analyze", async (req: AuthenticatedRequest, res) => { try { await owned(req); const intelligence = await analyzeWorkspace(req.user!.id, req.params.projectId); await (await projects()).updateOne({ _id: req.params.projectId, userId: req.user!.id }, { $set: { ...intelligence, updatedAt: new Date() } }); res.json(intelligence); } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : "Analysis unavailable" }); } });
export default router;
