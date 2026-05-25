import { getSupabaseServerClient } from "./supabase/server";
import type { Project, Scenario } from "~/types";

/**
 * Data Access Layer (DAL) for Supabase operations.
 * 
 * ⚠️ All functions MUST be scoped to the authenticated user's ID
 * because the underlying Supabase client uses the SERVICE_ROLE key.
 */

export async function getProjects(request: Request, userId: string) {
  const { supabase } = getSupabaseServerClient(request);
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function getProject(request: Request, userId: string, projectId: string) {
  const { supabase } = getSupabaseServerClient(request);
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Project;
}

export async function getScenarios(request: Request, userId: string, projectId: string) {
  const { supabase } = getSupabaseServerClient(request);
  
  // Verify project ownership first
  const project = await getProject(request, userId, projectId);
  if (!project) throw new Error("Unauthorized: Project not found or does not belong to user.");

  const { data, error } = await supabase
    .from("scenarios")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Scenario[];
}

export async function deleteProject(request: Request, userId: string, projectId: string) {
  const { supabase } = getSupabaseServerClient(request);
  
  // Scoping is critical here
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteScenario(request: Request, userId: string, scenarioId: string, projectId: string) {
  const { supabase } = getSupabaseServerClient(request);

  // Verify project ownership
  const project = await getProject(request, userId, projectId);
  if (!project) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("scenarios")
    .delete()
    .eq("id", scenarioId)
    .eq("project_id", projectId);

  if (error) throw error;
}

export async function updateScenario(
  request: Request, 
  userId: string, 
  projectId: string, 
  scenarioId: string, 
  updates: Partial<Pick<Scenario, "name" | "inputs" | "results" | "sort_order">>
) {
  const { supabase } = getSupabaseServerClient(request);

  // Verify project ownership
  const project = await getProject(request, userId, projectId);
  if (!project) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("scenarios")
    .update(updates)
    .eq("id", scenarioId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) throw error;
  return data as Scenario;
}

export async function createScenario(
  request: Request,
  userId: string,
  projectId: string,
  name: string,
  inputs: any,
  sortOrder: number,
  id?: string
) {
  const { supabase } = getSupabaseServerClient(request);

  // Verify project ownership
  const project = await getProject(request, userId, projectId);
  if (!project) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("scenarios")
    .insert({
      ...(id ? { id } : {}),
      project_id: projectId,
      name,
      sort_order: sortOrder,
      inputs,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Scenario;
}
