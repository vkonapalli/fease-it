import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/Button";
import { BUILT_IN_PACKS, getAllPacks, createScenariosFromPack } from "~/lib/templates";
import { useAppStore } from "~/stores/appStore";
import { createProject, createScenario } from "~/services/projectService";
import { isSupabaseConfigured } from "~/services/authService";
import { FolderOpen, X, Check, ChevronDown, Settings, Trash2 } from "lucide-react";
import type { TemplatePack, ScenarioTemplate, FeasibilityInputs } from "~/types";
import type { Scenario } from "~/stores/appStore";

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectDialog({ isOpen, onClose }: CreateProjectDialogProps) {
  const navigate = useNavigate();
  const customPacks = useAppStore((s) => s.customPacks);
  const preferredPackId = useAppStore((s) => s.preferredPackId);
  const saveCustomPack = useAppStore((s) => s.saveCustomPack);
  const deleteCustomPack = useAppStore((s) => s.deleteCustomPack);
  const setPreferredPack = useAppStore((s) => s.setPreferredPack);
  const setProject = useAppStore((s) => s.setProject);
  const setScenarios = useAppStore((s) => s.setScenarios);
  const setActiveScenario = useAppStore((s) => s.setActiveScenario);

  const allPacks = useMemo(() => getAllPacks(customPacks), [customPacks]);

  const [step, setStep] = useState<"details" | "templates">("details");
  const [projectName, setProjectName] = useState("");
  const [selectedPackId, setSelectedPackId] = useState<string>(preferredPackId ?? BUILT_IN_PACKS[0].id);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Pre-select all scenarios when pack changes
  useEffect(() => {
    const pack = allPacks.find((p) => p.id === selectedPackId);
    if (pack) {
      setSelectedScenarioIds(pack.scenarios.map((s) => s.id));
    }
  }, [selectedPackId, allPacks]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setStep("details");
      setProjectName("");
      setSelectedPackId(preferredPackId ?? BUILT_IN_PACKS[0].id);
      setCreating(false);
      setShowSettings(false);
    }
  }, [isOpen, preferredPackId]);

  const selectedPack = allPacks.find((p) => p.id === selectedPackId);

  function toggleScenario(id: string) {
    setSelectedScenarioIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (!selectedPack) return;
    const allIds = selectedPack.scenarios.map((s) => s.id);
    const allSelected = allIds.every((id) => selectedScenarioIds.includes(id));
    setSelectedScenarioIds(allSelected ? [] : allIds);
  }

  function buildLocalScenarios(scenarios: { name: string; inputs: FeasibilityInputs }[]): Scenario[] {
    return scenarios.map((s, i) => ({
      id: crypto.randomUUID(),
      name: s.name,
      inputs: s.inputs,
      sortOrder: i,
      synced: false,
      remoteId: null,
    }));
  }

  async function handleCreate() {
    if (!projectName.trim() || !selectedPack || selectedScenarioIds.length === 0) return;

    setCreating(true);
    try {
      const scenariosToCreate = createScenariosFromPack(selectedPack, selectedScenarioIds);
      let projectId: string;
      let projectNameFinal = projectName.trim();

      if (isSupabaseConfigured()) {
        const project = await createProject(projectNameFinal);
        projectId = project.id;
        projectNameFinal = project.name;

        for (let i = 0; i < scenariosToCreate.length; i++) {
          const s = scenariosToCreate[i];
          await createScenario(projectId, s.name, s.inputs, i);
        }
      } else {
        // Local-only mode
        projectId = crypto.randomUUID();
      }

      // Set active project and scenarios
      setProject(projectId, projectNameFinal);
      const localScenarios = buildLocalScenarios(scenariosToCreate);
      setScenarios(localScenarios);
      setActiveScenario(localScenarios[0].id);

      onClose();
      navigate("/");
    } catch (err) {
      console.error("Failed to create project with scenarios:", err);
      alert("Failed to create project. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  function handleSaveAsCustomPack() {
    if (!selectedPack) return;
    const name = prompt("Name this custom template pack:", `${selectedPack.name} (Custom)`);
    if (!name?.trim()) return;

    const customPack: TemplatePack = {
      id: `custom-${crypto.randomUUID()}`,
      name: name.trim(),
      description: `Custom pack based on ${selectedPack.name}`,
      isBuiltIn: false,
      scenarios: selectedPack.scenarios.filter((s) => selectedScenarioIds.includes(s.id)),
    };
    saveCustomPack(customPack);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-primary">
            {step === "details" ? "Create New Project" : "Choose Scenario Templates"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {step === "details" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., 42 Smith Street Subdivision"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && projectName.trim()) {
                      setStep("templates");
                    }
                  }}
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">What happens next?</h3>
                <p className="text-sm text-gray-500">
                  You will choose a template pack of pre-configured scenarios. Each scenario
                  represents a different development strategy (sell all, hold for rent, SDA, etc.).
                </p>
              </div>

              <Button
                className="w-full"
                disabled={!projectName.trim()}
                onClick={() => setStep("templates")}
              >
                Continue
              </Button>
            </div>
          )}

          {step === "templates" && (
            <div className="space-y-4">
              {/* Pack Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Template Pack
                  </label>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-xs text-gray-500 hover:text-accent flex items-center gap-1"
                  >
                    <Settings className="h-3 w-3" />
                    {showSettings ? "Done" : "Manage"}
                  </button>
                </div>

                {showSettings ? (
                  <div className="border border-gray-200 rounded-lg p-3 space-y-3">
                    <p className="text-xs text-gray-500">
                      Set your preferred default pack for new projects.
                    </p>
                    <div className="space-y-2">
                      {allPacks.map((pack) => (
                        <label
                          key={pack.id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="preferred-pack"
                            checked={preferredPackId === pack.id}
                            onChange={() => setPreferredPack(pack.id)}
                            className="text-accent focus:ring-accent"
                          />
                          <span className="text-sm text-gray-700 flex-1">{pack.name}</span>
                          {!pack.isBuiltIn && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (confirm(`Delete "${pack.name}"?`)) {
                                  deleteCustomPack(pack.id);
                                }
                              }}
                              className="text-gray-400 hover:text-error"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </label>
                      ))}
                    </div>
                    {preferredPackId && (
                      <button
                        onClick={() => setPreferredPack(null)}
                        className="text-xs text-gray-500 hover:text-accent"
                      >
                        Clear preference
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedPackId}
                      onChange={(e) => setSelectedPackId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm appearance-none focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent bg-white"
                    >
                      {allPacks.map((pack) => (
                        <option key={pack.id} value={pack.id}>
                          {pack.name} {pack.isBuiltIn ? "(Built-in)" : "(Custom)"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                )}

                {selectedPack && !showSettings && (
                  <p className="text-xs text-gray-500 mt-1">{selectedPack.description}</p>
                )}
              </div>

              {/* Scenario Selection */}
              {!showSettings && selectedPack && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Scenarios to Include
                    </label>
                    <button
                      onClick={toggleAll}
                      className="text-xs text-accent hover:underline"
                    >
                      {selectedScenarioIds.length === selectedPack.scenarios.length
                        ? "Deselect all"
                        : "Select all"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {selectedPack.scenarios.map((scenario) => (
                      <ScenarioCheckbox
                        key={scenario.id}
                        scenario={scenario}
                        checked={selectedScenarioIds.includes(scenario.id)}
                        onChange={() => toggleScenario(scenario.id)}
                      />
                    ))}
                  </div>

                  {selectedScenarioIds.length === 0 && (
                    <p className="text-xs text-error mt-2">
                      Select at least one scenario.
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              {!showSettings && (
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep("details")}
                  >
                    Back
                  </Button>
                  <div className="flex-1" />
                  {selectedPack?.isBuiltIn && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveAsCustomPack}
                      disabled={selectedScenarioIds.length === 0}
                    >
                      Save as Custom
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={selectedScenarioIds.length === 0 || creating}
                    onClick={handleCreate}
                  >
                    {creating ? (
                      <>
                        <span className="animate-spin mr-1">⟳</span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <FolderOpen className="h-4 w-4 mr-1" />
                        Create Project
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScenarioCheckbox({
  scenario,
  checked,
  onChange,
}: {
  scenario: ScenarioTemplate;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
      <div className="mt-0.5">
        <div
          className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
            checked
              ? "bg-accent border-accent"
              : "border-gray-300 bg-white"
          }`}
        >
          {checked && <Check className="h-3.5 w-3.5 text-white" />}
        </div>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={onChange}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{scenario.name}</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
            {scenario.strategy.replace(/-/g, " ")}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{scenario.description}</p>
      </div>
    </label>
  );
}
