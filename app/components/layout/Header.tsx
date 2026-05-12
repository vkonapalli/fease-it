import { Button } from "~/components/ui/Button";
import { Calculator, Download, FolderOpen, LogOut } from "lucide-react";
import { useFeasibilityStore } from "~/stores/feasibilityStore";
import { exportAllScenariosToCSV } from "~/lib/export";
import { useAppStore } from "~/stores/appStore";
import { Link, useNavigate } from "react-router";
import { signOut } from "~/services/authService";

export function Header() {
  const { inputs } = useFeasibilityStore();
  const projectName = useAppStore((s) => s.projectName);
  const navigate = useNavigate();

  const handleExport = () => {
    // TODO: update export to work with multi-scenario structure
    console.log("Export triggered");
  };

  async function handleSignOut() {
    await signOut();
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
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-error hover:bg-red-50">
            <LogOut className="h-4 w-4 mr-1" /> Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
