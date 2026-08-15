import {
  teamsTable,
  teamMembersTable,
  teamInvitationsTable,
  type InsertTeam,
  type InsertTeamMember,
  type InsertTeamInvitation,
  type TeamRole,
} from "@workspace/db";
import { db } from "@workspace/db";
import { eq, and } from "drizzle-orm";

/**
 * Create a new team
 */
export async function createTeam(team: InsertTeam) {
  const result = await db.insert(teamsTable).values(team).returning();
  return result[0];
}

/**
 * Get team by ID
 */
export async function getTeamById(teamId: string) {
  const result = await db.select().from(teamsTable).where(eq(teamsTable.id, teamId));
  return result[0] || null;
}

/**
 * Get all teams owned by user
 */
export async function getTeamsByOwnerId(userId: string) {
  return await db.select().from(teamsTable).where(eq(teamsTable.ownerId, userId));
}

/**
 * Get all teams user is member of
 */
export async function getTeamsByUserId(userId: string) {
  return await db
    .select()
    .from(teamsTable)
    .innerJoin(teamMembersTable, eq(teamsTable.id, teamMembersTable.teamId))
    .where(eq(teamMembersTable.userId, userId));
}

/**
 * Add member to team
 */
export async function addTeamMember(member: InsertTeamMember) {
  const result = await db.insert(teamMembersTable).values(member).returning();
  return result[0];
}

/**
 * Update team member role
 */
export async function updateTeamMemberRole(
  teamId: string,
  userId: string,
  role: TeamRole
) {
  const result = await db
    .update(teamMembersTable)
    .set({ role })
    .where(and(eq(teamMembersTable.teamId, teamId), eq(teamMembersTable.userId, userId)))
    .returning();
  return result[0] || null;
}

/**
 * Remove member from team
 */
export async function removeTeamMember(teamId: string, userId: string) {
  await db
    .delete(teamMembersTable)
    .where(and(eq(teamMembersTable.teamId, teamId), eq(teamMembersTable.userId, userId)));
  return true;
}

/**
 * Get team members
 */
export async function getTeamMembers(teamId: string) {
  return await db
    .select()
    .from(teamMembersTable)
    .where(eq(teamMembersTable.teamId, teamId));
}

/**
 * Get user's role in team
 */
export async function getUserRoleInTeam(teamId: string, userId: string) {
  const result = await db
    .select()
    .from(teamMembersTable)
    .where(and(eq(teamMembersTable.teamId, teamId), eq(teamMembersTable.userId, userId)));
  return result[0]?.role || null;
}

/**
 * Create team invitation
 */
export async function createTeamInvitation(invitation: InsertTeamInvitation) {
  const result = await db.insert(teamInvitationsTable).values(invitation).returning();
  return result[0];
}

/**
 * Get team invitation by token
 */
export async function getInvitationByToken(token: string) {
  const result = await db
    .select()
    .from(teamInvitationsTable)
    .where(eq(teamInvitationsTable.token, token));
  return result[0] || null;
}

/**
 * Accept team invitation
 */
export async function acceptTeamInvitation(token: string, userId: string) {
  const invitation = await getInvitationByToken(token);
  if (!invitation) return false;

  // Check if invitation is expired
  if (new Date() > invitation.expiresAt) return false;

  // Add user to team with role from invitation
  await addTeamMember({
    teamId: invitation.teamId,
    userId,
    role: invitation.role,
  });

  // Mark invitation as accepted
  await db
    .update(teamInvitationsTable)
    .set({ acceptedBy: userId, acceptedAt: new Date() })
    .where(eq(teamInvitationsTable.token, token));

  return true;
}

/**
 * Get pending invitations for email
 */
export async function getPendingInvitationsForEmail(email: string) {
  return await db
    .select()
    .from(teamInvitationsTable)
    .where(
      and(
        eq(teamInvitationsTable.invitedEmail, email),
        // acceptedAt is nullable; Drizzle needs an explicit null comparison with isNull
        eq(teamInvitationsTable.acceptedAt, null as any)
      )
    );
}

/**
 * Update team
 */
export async function updateTeam(teamId: string, updates: Partial<typeof teamsTable.$inferInsert>) {
  const result = await db
    .update(teamsTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(teamsTable.id, teamId))
    .returning();
  return result[0] || null;
}

/**
 * Delete team
 */
export async function deleteTeam(teamId: string) {
  await db.delete(teamsTable).where(eq(teamsTable.id, teamId));
  return true;
}
