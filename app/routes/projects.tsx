import { useState } from "react";
import { Form, Link, redirect, useFetcher, useLoaderData, useNavigate } from "react-router";
import type { Route } from "./+types/projects";
import { Plus, FolderOpen, Trash2, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { CreateProjectDialog } from "~/components/inputs/CreateProjectDialog";
import { parseRequestData, validateOrigin } from "~/lib/utils.server";
import { getSupabaseServerClient } from "~/lib/supabase/server";
import { requireAuth } from "~/lib/auth.server";
import { isSupabaseConfigured } from "~/lib/supabase/client";
import { useAppStore } from "~/stores/appStore";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export async function loader({ request }: Route.LoaderArgs) {
  if (!isSupabaseConfigured()) {
    return { projects: [], localOnly: true };
  }

  const { user, supabase, headers } = await requireAuth(request);
  if (!user || !supabase) {
    return redirect("/login", { headers });
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Response(error.message, { status: 500 });
  }

  return { projects: (data ?? []) as Project[], localOnly: false };
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "GET" && !validateOrigin(request)) {
    return { error: "Invalid origin" };
  }

  const rawData = await parseRequestData(request);
  const data = rawData as Record<string, unknown>;
  
  if (typeof data.scenarios === "string") {
    try {
      data.scenarios = JSON.parse(data.scenarios);
    } catch (e) {
      data.scenarios = [];
    }
  }

  const intent = data.intent as string;
  const id = data.id as string | undefined;
  const name = data.name as string | undefined;
  const scenarios = data.scenarios;

  if (!isSupabaseConfigured()) {
    return { ok: true, localOnly: true };
  }

  const { user, supabase, headers } = await requireAuth(request);
  if (!user || !supabase) {
    return redirect("/login", { headers });
  }

  if (intent === "delete") {
    const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      return { error: error.message };
    }
    return { ok: true };
  }

  if (intent === "create") {
    // 1. Create project
    const { data: project, error: pError } = await supabase
      .from("projects")
      .insert({ name, user_id: user.id })
      .select()
      .single();

    if (pError || !project) {
      return { error: pError?.message || "Failed to create project" };
    }

    // 2. Create scenarios
    const scenarioList = Array.isArray(scenarios) ? scenarios : [];
    const { error: sError } = await supabase
      .from("scenarios")
      .insert(
        scenarioList.map((s: any, i: number) => ({
          project_id: project.id,
          name: s.name,
          inputs: s.inputs,
          sort_order: i,
        }))
      );

    if (sError) {
       return { error: sError.message };
    }

    return redirect(`/projects/${project.id}`);
  }

  return { error: "Unknown intent." };
}

export default function ProjectsPage({ loaderData }: Route.ComponentProps) {
  const { projects: initialProjects, localOnly } = loaderData;
  const navigate = useNavigate();
  const setProject = useAppStore((s) => s.setProject);
  const fetcher = useFetcher<typeof action>();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Optimistically remove deleted projects from UI
  const isDeleting = fetcher.state === "submitting" && fetcher.formData?.get("intent") === "delete";
  const deletingId = isDeleting ? (fetcher.formData?.get("id") as string) : null;
  const projects = deletingId
    ? initialProjects.filter((p) => p.id !== deletingId)
    : initialProjects;

  function handleOpen(project: Project) {
    setProject(project.id, project.name);
    navigate(`/projects/${project.id}`);
  }

  if (localOnly && projects.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Project
          </Button>
        </div>
        <div className="text-center py-16">
          <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No projects yet</h3>
          <p className="text-sm text-gray-500 mt-1">Create your first feasibility project.</p>
        </div>
        <CreateProjectDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onCreated={(project) => {
            // In local-only mode, the dialog handles all state
            navigate(`/projects/${project.id}`);
          }}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Create Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No projects yet</h3>
          <p className="text-sm text-gray-500 mt-1">Create your first feasibility project.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{project.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 mb-4">
                  Created {new Date(project.created_at).toLocaleDateString("en-AU")}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => handleOpen(project)}>
                    <FolderOpen className="h-4 w-4 mr-1" />
                    Open
                  </Button>
                  <fetcher.Form method="post" className="inline">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id" value={project.id} />
                    <Button
                      size="sm"
                      variant="ghost"
                      type="submit"
                      className="text-error hover:bg-red-50"
                      disabled={isDeleting && deletingId === project.id}
                    >
                      {isDeleting && deletingId === project.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </fetcher.Form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateProjectDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(project) => {
          // After server-side creation, navigate to the new project
          setProject(project.id, project.name);
          navigate(`/projects/${project.id}`);
        }}
      />
    </main>
  );
}
