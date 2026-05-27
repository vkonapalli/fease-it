import { Button } from "~/components/ui/Button";
import { Calculator, Download, FolderOpen, LogOut, Settings } from "lucide-react";
import { useAppStore } from "~/stores/appStore";
import { exportAllScenariosToCSV } from "~/lib/export";
import { calculateFeasibility } from "~/lib/calculations";
import { Link, useNavigate } from "react-router";
import { getSupabaseBrowserClient } from "~/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface HeaderProps {
  user: User | null;
}

export function Header({ user }: HeaderProps) {
  const projectName = useAppStore((s) => s.projectName);
  const activeScenario = useAppStore((s) => s.getActiveScenario());
  const navigate = useNavigate();

  const handleExport = () => {
    if (!activeScenario) return;
    const results = calculateFeasibility(activeScenario.inputs);
    exportAllScenariosToCSV(results, projectName || "fease-it");
  };

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-xl font-bold text-primary">Fease-it</h1>
            {projectName && (
              <span className="text-xs text-gray-500">{projectName}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/projects">
            <Button variant="ghost" size="sm">
              <FolderOpen className="h-4 w-4 mr-1" /> Projects
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-1" /> Settings
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          {user && (
            <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label="Delete project" className="text-error hover:bg-red-50">
              <LogOut className="h-4 w-4 mr-1" /> Sign out
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
