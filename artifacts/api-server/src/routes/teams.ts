import { Router, type Response } from "express";
import { type AuthenticatedRequest, authMiddleware, assertAuthenticated } from "../middlewares/auth";
import {
  createTeam,
  getTeamsByOwnerId,
  getTeamsByUserId,
  getTeamById,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  createTeamInvitation,
  acceptTeamInvitation,
  getPendingInvitationsForEmail,
  updateTeam,
  deleteTeam,
  getUserRoleInTeam,
} from "../services/teams";
import { logger } from "../lib/logger";
import { v4 as uuidv4 } from "uuid";

const router = Router();

/**
 * POST /api/teams
 * Create new team
 */
router.post("/teams", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const { name, description } = req.body;

    const team = await createTeam({
      name,
      description,
      ownerId: userId,
    });

    // Add creator as owner
    await addTeamMember({
      teamId: team.id,
      userId,
      role: "owner",
    });

    res.status(201).json({ team });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create team";
    logger.error({ err: error as any }, "Create team error");
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/teams
 * Get all teams for user
 */
router.get("/teams", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);

    const owned = await getTeamsByOwnerId(userId);
    const member = await getTeamsByUserId(userId);

    res.json({
      owned,
      member: member.map((m: any) => m.teams),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get teams";
    logger.error({ err: error as any }, "Get teams error");
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/teams/:teamId
 * Get team details
 */
router.get("/teams/:teamId", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const { teamId } = req.params;

    const team = await getTeamById(teamId as string);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    // Check if user is member or owner
    const role = await getUserRoleInTeam(teamId as string, userId);
    if (!role && team.ownerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const members = await getTeamMembers(teamId as string);

    res.json({ team, members });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get team";
    logger.error({ err: error as any }, "Get team error");
    res.status(400).json({ error: message });
  }
});

/**
 * PUT /api/teams/:teamId
 * Update team
 */
router.put("/teams/:teamId", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const { teamId } = req.params;
    const { name, description } = req.body;

    const team = await getTeamById(teamId as string);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    if (team.ownerId !== userId) {
      res.status(403).json({ error: "Only owner can update team" });
      return;
    }

    const updated = await updateTeam(teamId as string, { name, description });

    res.json({ team: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update team";
    logger.error({ err: error as any }, "Update team error");
    res.status(400).json({ error: message });
  }
});

/**
 * DELETE /api/teams/:teamId
 * Delete team
 */
router.delete("/teams/:teamId", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const { teamId } = req.params;

    const team = await getTeamById(teamId as string);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    if (team.ownerId !== userId) {
      res.status(403).json({ error: "Only owner can delete team" });
      return;
    }

    await deleteTeam(teamId as string);

    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete team";
    logger.error({ err: error as any }, "Delete team error");
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/teams/:teamId/members
 * Add member to team (by email with invitation)
 */
router.post(
  "/teams/:teamId/members",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = assertAuthenticated(req);
      const { teamId } = req.params;
      const { email, role } = req.body;

      const team = await getTeamById(teamId as string);
      if (!team) {
        res.status(404).json({ error: "Team not found" });
        return;
      }

      if (team.ownerId !== userId) {
        res.status(403).json({ error: "Only owner can add members" });
        return;
      }

      const token = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

      const invitation = await createTeamInvitation({
        teamId: teamId as string,
        invitedEmail: email,
        invitedBy: userId,
        role: role || "viewer",
        token,
        expiresAt,
      });

      res.status(201).json({
        invitation,
        inviteUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/invite/${token}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add member";
      logger.error({ err: error as any }, "Add member error");
      res.status(400).json({ error: message });
    }
  }
);

/**
 * GET /api/teams/:teamId/members
 * Get team members
 */
router.get("/teams/:teamId/members", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const { teamId } = req.params;

    const team = await getTeamById(teamId as string);
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    const role = await getUserRoleInTeam(teamId as string, userId);
    if (!role && team.ownerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const members = await getTeamMembers(teamId as string);
    res.json({ members });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get members";
    logger.error({ err: error as any }, "Get members error");
    res.status(400).json({ error: message });
  }
});

/**
 * PUT /api/teams/:teamId/members/:memberId/role
 * Update member role
 */
router.put(
  "/teams/:teamId/members/:memberId/role",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = assertAuthenticated(req);
      const { teamId, memberId } = req.params;
      const { role } = req.body;

      const team = await getTeamById(teamId as string);
      if (!team) {
        res.status(404).json({ error: "Team not found" });
        return;
      }

      if (team.ownerId !== userId) {
        res.status(403).json({ error: "Only owner can update roles" });
        return;
      }

      const updated = await updateTeamMemberRole(teamId as string, memberId as string, role);

      res.json({ member: updated });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update role";
      logger.error({ err: error as any }, "Update role error");
      res.status(400).json({ error: message });
    }
  }
);

/**
 * DELETE /api/teams/:teamId/members/:memberId
 * Remove member from team
 */
router.delete(
  "/teams/:teamId/members/:memberId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = assertAuthenticated(req);
      const { teamId, memberId } = req.params;

      const team = await getTeamById(teamId as string);
      if (!team) {
        res.status(404).json({ error: "Team not found" });
        return;
      }

      if (team.ownerId !== userId) {
        res.status(403).json({ error: "Only owner can remove members" });
        return;
      }

      await removeTeamMember(teamId as string, memberId as string);

      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove member";
      logger.error({ err: error as any }, "Remove member error");
      res.status(400).json({ error: message });
    }
  }
);

/**
 * POST /api/invitations/accept
 * Accept team invitation
 */
router.post("/invitations/accept", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    const { token } = req.body;

    const success = await acceptTeamInvitation(token, userId);
    if (!success) {
      res.status(400).json({ error: "Invalid or expired invitation" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to accept invitation";
    logger.error({ err: error as any }, "Accept invitation error");
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/invitations/pending
 * Get pending invitations for user (by email)
 */
router.get("/invitations/pending", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = assertAuthenticated(req);
    // In a real app, fetch user email from database
    // For now, we'd need the email from auth context
    const { email } = req.body;

    const invitations = await getPendingInvitationsForEmail(email);
    res.json({ invitations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get invitations";
    logger.error({ err: error as any }, "Get invitations error");
    res.status(400).json({ error: message });
  }
});

export default router;
