import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, FolderOpen, Trash2, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { CreateProjectDialog } from "~/components/inputs/CreateProjectDialog";
import { getCurrentUser, isSupabaseConfigured } from "~/services/authService";
import { getProjects, deleteProject } from "~/services/projectService";
import type { Project } from "~/services/projectService";
import { useAppStore } from "~/stores/appStore";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const setProject = useAppStore((s) => s.setProject);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        if (!isSupabaseConfigured()) {
          setLoading(false);
          return;
        }
        const user = await getCurrentUser();
        if (!user) {
          navigate("/login");
          return;
        }
        const data = await getProjects();
        setProjects(data);
      } catch (err) {
        console.warn("Supabase not configured or init failed:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [navigate]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this project and all its scenarios?")) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  }

  function handleOpen(project: Project) {
    setProject(project.id, project.name);
    navigate(`/projects/${project.id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(project.id)}
                      className="text-error hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      <CreateProjectDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} />
    </main>
  );
}
