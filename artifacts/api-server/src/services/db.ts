import { eq, and } from "drizzle-orm";
import { db, usersTable, projectsTable, deploymentsTable, agentRunsTable, usageTable } from "@workspace/db";
import { generateId } from "../lib/crypto";
import type { InsertUser, User, InsertProject, Project, InsertDeployment, Deployment, InsertAgentRun, AgentRun, InsertUsage } from "@workspace/db";

/**
 * User Service
 */
export async function createUser(data: Omit<InsertUser, "id">): Promise<User> {
  const user: InsertUser = {
    ...data,
    id: generateId(),
  };
  const result = await db.insert(usersTable).values(user).returning();
  return result[0];
}

export async function getUserById(userId: string): Promise<User | undefined> {
  const result = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return result[0];
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const result = await db.select().from(usersTable).where(eq(usersTable.email, email));
  return result[0];
}

export async function updateUser(userId: string, data: Partial<InsertUser>): Promise<User | undefined> {
  const result = await db
    .update(usersTable)
    .set(data)
    .where(eq(usersTable.id, userId))
    .returning();
  return result[0];
}

/**
 * Project Service
 */
export async function createProject(data: Omit<InsertProject, "id">): Promise<Project> {
  const project: InsertProject = {
    ...data,
    id: generateId(),
  };
  const result = await db.insert(projectsTable).values(project).returning();
  return result[0];
}

export async function getProjectsByUserId(userId: string): Promise<Project[]> {
  return db.select().from(projectsTable).where(eq(projectsTable.userId, userId));
}

export async function getProjectById(projectId: string): Promise<Project | undefined> {
  const result = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  return result[0];
}

export async function getProjectByUserAndId(userId: string, projectId: string): Promise<Project | undefined> {
  const result = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.userId, userId), eq(projectsTable.id, projectId)));
  return result[0];
}

export async function updateProject(projectId: string, data: Partial<InsertProject>): Promise<Project | undefined> {
  const result = await db
    .update(projectsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projectsTable.id, projectId))
    .returning();
  return result[0];
}

export async function deleteProject(projectId: string): Promise<boolean> {
  const result = await db.delete(projectsTable).where(eq(projectsTable.id, projectId));
  return (result.rowCount ?? 0) > 0;
}

/**
 * Deployment Service
 */
export async function createDeployment(data: Omit<InsertDeployment, "id">): Promise<Deployment> {
  const deployment: InsertDeployment = {
    ...data,
    id: generateId(),
  };
  const result = await db.insert(deploymentsTable).values(deployment).returning();
  return result[0];
}

export async function getDeploymentsByProjectId(projectId: string): Promise<Deployment[]> {
  return db.select().from(deploymentsTable).where(eq(deploymentsTable.projectId, projectId));
}

export async function getDeploymentsByUserId(userId: string): Promise<Deployment[]> {
  return db.select().from(deploymentsTable).where(eq(deploymentsTable.userId, userId));
}

export async function updateDeployment(deploymentId: string, data: Partial<InsertDeployment>): Promise<Deployment | undefined> {
  const result = await db
    .update(deploymentsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(deploymentsTable.id, deploymentId))
    .returning();
  return result[0];
}

/**
 * Agent Run Service
 */
export async function createAgentRun(data: Omit<InsertAgentRun, "id">): Promise<AgentRun> {
  const run: InsertAgentRun = {
    ...data,
    id: generateId(),
  };
  const result = await db.insert(agentRunsTable).values(run).returning();
  return result[0];
}

export async function getAgentRunsByProjectId(projectId: string): Promise<AgentRun[]> {
  return db.select().from(agentRunsTable).where(eq(agentRunsTable.projectId, projectId));
}

export async function updateAgentRun(runId: string, data: Partial<InsertAgentRun>): Promise<AgentRun | undefined> {
  const result = await db
    .update(agentRunsTable)
    .set(data)
    .where(eq(agentRunsTable.id, runId))
    .returning();
  return result[0];
}

/**
 * Usage Service
 */
export async function recordUsage(data: Omit<InsertUsage, "id">): Promise<any> {
  const usage: InsertUsage = {
    ...data,
    id: generateId(),
  };
  const result = await db.insert(usageTable).values(usage).returning();
  return result[0];
}

export async function getUserUsageByDate(userId: string, date: Date): Promise<any | undefined> {
  const dateStr = date.toISOString().split("T")[0];
  const result = await db
    .select()
    .from(usageTable)
    .where(and(eq(usageTable.userId, userId), eq(usageTable.date, dateStr as any)));
  return result[0];
}

export async function getTotalUsageThisMonth(userId: string): Promise<any | undefined> {
  // This is a placeholder - in production, you'd aggregate
  // For now, just get the most recent usage record
  const result = await db
    .select()
    .from(usageTable)
    .where(eq(usageTable.userId, userId));
  return result[result.length - 1];
}
