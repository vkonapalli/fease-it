import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, FolderOpen, Trash2, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { signInAnonymously, getCurrentUser } from "~/services/authService";
import { getProjects, createProject, deleteProject } from "~/services/projectService";
import type { Project } from "~/services/projectService";
import { useAppStore } from "~/stores/appStore";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const setProject = useAppStore((s) => s.setProject);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          await signInAnonymously();
        }
        const data = await getProjects();
        setProjects(data);
      } catch (err) {
        console.warn("Supabase not configured or init failed:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const project = await createProject(newName.trim());
      setProjects((prev) => [project, ...prev]);
      setNewName("");
      // Navigate to the project
      setProject(project.id, project.name);
      navigate("/");
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setCreating(false);
    }
  }

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
    navigate("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Fease-it</h1>
          <p className="text-sm text-gray-500">Projects</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <form onSubmit={handleCreate} className="mb-8 flex gap-3">
          <input
            type="text"
            placeholder="New project name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <Button type="submit" disabled={creating || !newName.trim()}>
            <Plus className="h-4 w-4 mr-1" />
            Create
          </Button>
        </form>

        {projects.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No projects yet</h3>
            <p className="text-sm text-gray-500 mt-1">Create your first feasibility project above.</p>
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
      </main>
    </div>
  );
}
