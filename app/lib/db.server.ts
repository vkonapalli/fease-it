import type { Project, DbScenario, FeasibilityInputs, FeasibilityResults } from "~/types";
import { db } from "./db";
import { projects, scenarios } from "./db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Data Access Layer (DAL) for Supabase operations using Drizzle ORM.
 * 
 * ⚠️ All functions MUST be scoped to the authenticated user's ID
 * because the underlying database operations bypass RLS when using the postgres admin connection string.
 */

export async function getProjects(request: Request, userId: string) {
  if (!db) throw new Error("Database connection not initialized.");

  const data = await db
    .select()
    .from(projects)
    .where(eq(projects.user_id, userId))
    .orderBy(desc(projects.created_at));

  return data as Project[];
}

export async function getProject(request: Request, userId: string, projectId: string) {
  if (!db) throw new Error("Database connection not initialized.");

  const [data] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.user_id, userId)))
    .limit(1);

  if (!data) return null;
  return data as Project;
}

export async function getScenarios(request: Request, userId: string, projectId: string) {
  if (!db) throw new Error("Database connection not initialized.");
  
  // Verify project ownership first
  const project = await getProject(request, userId, projectId);
  if (!project) throw new Error("Unauthorized: Project not found or does not belong to user.");

  const data = await db
    .select()
    .from(scenarios)
    .where(eq(scenarios.project_id, projectId))
    .orderBy(scenarios.sort_order, scenarios.created_at);

  return data as unknown as DbScenario[];
}

export async function deleteProject(request: Request, userId: string, projectId: string) {
  if (!db) throw new Error("Database connection not initialized.");
  
  // Scoping is critical here
  await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.user_id, userId)));
}

export async function deleteScenario(request: Request, userId: string, scenarioId: string, projectId: string) {
  if (!db) throw new Error("Database connection not initialized.");

  // Verify project ownership
  const project = await getProject(request, userId, projectId);
  if (!project) throw new Error("Unauthorized");

  await db
    .delete(scenarios)
    .where(and(eq(scenarios.id, scenarioId), eq(scenarios.project_id, projectId)));
}

export async function updateScenario(
  request: Request, 
  userId: string, 
  projectId: string, 
  scenarioId: string, 
  updates: Partial<Pick<DbScenario, "name" | "inputs" | "results" | "sort_order">>
) {
  if (!db) throw new Error("Database connection not initialized.");

  // Verify project ownership
  const project = await getProject(request, userId, projectId);
  if (!project) throw new Error("Unauthorized");

  const [data] = await db
    .update(scenarios)
    .set({
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.inputs !== undefined ? { inputs: updates.inputs } : {}),
      ...(updates.results !== undefined ? { results: updates.results } : {}),
      ...(updates.sort_order !== undefined ? { sort_order: updates.sort_order } : {}),
      updated_at: new Date().toISOString(),
    })
    .where(and(eq(scenarios.id, scenarioId), eq(scenarios.project_id, projectId)))
    .returning();

  if (!data) throw new Error("Scenario not found or update failed");
  return data as unknown as DbScenario;
}

export async function createScenario(
  request: Request,
  userId: string,
  projectId: string,
  name: string,
  inputs: FeasibilityInputs,
  sortOrder: number,
  id?: string
) {
  if (!db) throw new Error("Database connection not initialized.");

  // Verify project ownership
  const project = await getProject(request, userId, projectId);
  if (!project) throw new Error("Unauthorized");

  const [data] = await db
    .insert(scenarios)
    .values({
      ...(id ? { id } : {}),
      project_id: projectId,
      name,
      sort_order: sortOrder,
      inputs,
    })
    .returning();

  return data as unknown as DbScenario;
}
