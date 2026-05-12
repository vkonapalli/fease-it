import { getSupabaseBrowserClient, isSupabaseConfigured } from "~/lib/supabase/client";
import type { FeasibilityInputs, FeasibilityResults } from "~/types";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Scenario {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
  inputs: FeasibilityInputs;
  results: FeasibilityResults | null;
  created_at: string;
  updated_at: string;
}

function checkConfig() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }
}

// ============================================================
// Project Service
// ============================================================

export async function getProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getProject(id: string): Promise<Project | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createProject(name: string): Promise<Project> {
  checkConfig();
  const supabase = getSupabaseBrowserClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("projects")
    .insert({ name, user_id: userData.user.id })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create project");
  return data;
}

export async function updateProject(id: string, updates: Partial<Pick<Project, "name">>): Promise<Project> {
  checkConfig();
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to update project");
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  checkConfig();
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// Scenario Service
// ============================================================

export async function getScenarios(projectId: string): Promise<Scenario[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("scenarios")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(deserializeScenario);
}

export async function getScenario(id: string): Promise<Scenario | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("scenarios")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return deserializeScenario(data);
}

export async function createScenario(
  projectId: string,
  name: string,
  inputs: FeasibilityInputs,
  sortOrder: number
): Promise<Scenario> {
  checkConfig();
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("scenarios")
    .insert({
      project_id: projectId,
      name,
      sort_order: sortOrder,
      inputs: inputs as unknown as Record<string, unknown>,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create scenario");
  return deserializeScenario(data);
}

export async function updateScenario(
  id: string,
  updates: Partial<Pick<Scenario, "name" | "inputs" | "results" | "sort_order">>
): Promise<Scenario> {
  checkConfig();
  const supabase = getSupabaseBrowserClient();
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.sort_order !== undefined) payload.sort_order = updates.sort_order;
  if (updates.inputs !== undefined) payload.inputs = updates.inputs as unknown as Record<string, unknown>;
  if (updates.results !== undefined) payload.results = updates.results as unknown as Record<string, unknown>;

  const { data, error } = await supabase
    .from("scenarios")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to update scenario");
  return deserializeScenario(data);
}

export async function deleteScenario(id: string): Promise<void> {
  checkConfig();
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("scenarios").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateScenario(
  id: string,
  overrides: Partial<Pick<Scenario, "name" | "inputs">> = {}
): Promise<Scenario> {
  const original = await getScenario(id);
  if (!original) throw new Error("Scenario not found");

  const supabase = getSupabaseBrowserClient();
  const { data: maxOrderData } = await supabase
    .from("scenarios")
    .select("sort_order")
    .eq("project_id", original.project_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const newSortOrder = (maxOrderData?.sort_order ?? 0) + 1;

  return createScenario(
    original.project_id,
    overrides.name ?? `${original.name} (Copy)`,
    overrides.inputs ?? original.inputs,
    newSortOrder
  );
}

// ============================================================
// Serialization helpers
// ============================================================

function deserializeScenario(row: Record<string, unknown>): Scenario {
  return {
    id: row.id as string,
    project_id: row.project_id as string,
    name: row.name as string,
    sort_order: row.sort_order as number,
    inputs: (row.inputs ?? {}) as FeasibilityInputs,
    results: (row.results ?? null) as FeasibilityResults | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}
