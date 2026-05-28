import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSubmit } from "react-router";
import { Button } from "~/components/ui/Button";
import { BUILT_IN_STRATEGIES, getAllStrategies, createScenariosFromStrategy, createBaseInputs } from "~/lib/templates";
import { useAppStore } from "~/stores/appStore";
import { isSupabaseConfigured } from "~/lib/supabase/client";
import { FolderOpen, X, Check, ChevronDown, Settings, Trash2 } from "lucide-react";
import type { Strategy, StrategyScenario, FeasibilityInputs, Project } from "~/types";
import { asMoney, asPercentage, asNat, asPositiveInt } from "~/lib/fundamental-types";
import type { Scenario } from "~/stores/appStore";

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (project: Project) => void;
}

export function CreateProjectDialog({ isOpen, onClose, onCreated }: CreateProjectDialogProps) {
  const navigate = useNavigate();
  const submit = useSubmit();
  const customStrategies = useAppStore((s) => s.customStrategies);
  const preferredStrategyId = useAppStore((s) => s.preferredStrategyId);
  const saveCustomStrategy = useAppStore((s) => s.saveCustomStrategy);
  const deleteCustomStrategy = useAppStore((s) => s.deleteCustomStrategy);
  const setPreferredStrategy = useAppStore((s) => s.setPreferredStrategy);
  const setProject = useAppStore((s) => s.setProject);

  const allStrategies = useMemo(() => getAllStrategies(customStrategies), [customStrategies]);

  const [step, setStep] = useState<"details" | "templates">("details");
  const [projectName, setProjectName] = useState("");
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(preferredStrategyId ?? BUILT_IN_STRATEGIES[0].id);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Pre-select all scenarios when strategy changes
  useEffect(() => {
    const strategy = allStrategies.find((p) => p.id === selectedStrategyId);
    if (strategy) {
      setSelectedScenarioIds(strategy.scenarios.map((s) => s.id));
    }
  }, [selectedStrategyId, allStrategies]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setStep("details");
      setProjectName("");
      setSelectedStrategyId(preferredStrategyId ?? BUILT_IN_STRATEGIES[0].id);
      setCreating(false);
      setShowSettings(false);
    }
  }, [isOpen, preferredStrategyId]);

  const selectedStrategy = allStrategies.find((p) => p.id === selectedStrategyId);

  function toggleScenario(id: string) {
    setSelectedScenarioIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (!selectedStrategy) return;
    const allIds = selectedStrategy.scenarios.map((s) => s.id);
    const allSelected = allIds.every((id) => selectedScenarioIds.includes(id));
    setSelectedScenarioIds(allSelected ? [] : allIds);
  }



  async function handleCreate() {
    if (!projectName.trim() || !selectedStrategy) return;

    setCreating(true);
    try {
      let scenariosToCreate: { name: string; inputs: FeasibilityInputs }[];

      if (selectedStrategy.scenarios.length === 0) {
        // Built-in strategy with no pre-built scenarios: create one default scenario
        scenariosToCreate = [{ name: "Scenario 1", inputs: createBaseInputs() }];
      } else {
        if (selectedScenarioIds.length === 0) return;
        scenariosToCreate = createScenariosFromStrategy(selectedStrategy, selectedScenarioIds);
      }

      submit(
        {
          intent: "create",
          name: projectName.trim(),
          scenarios: scenariosToCreate,
        },
        { method: "post", encType: "application/json" }
      );
      onClose();
    } catch (err) {
      console.error("Failed to create project with scenarios:", err);
      alert("Failed to create project. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  function handleSaveAsCustomStrategy() {
    if (!selectedStrategy) return;
    const name = prompt("Name this custom strategy:", `${selectedStrategy.name} (Custom)`);
    if (!name?.trim()) return;

    const customStrategy: Strategy = {
      id: `custom-${crypto.randomUUID()}`,
      name: name.trim(),
      description: `Custom strategy based on ${selectedStrategy.name}`,
      isBuiltIn: false,
      scenarios: selectedStrategy.scenarios.filter((s) => selectedScenarioIds.includes(s.id)),
    };
    saveCustomStrategy(customStrategy);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-primary">
            {step === "details" ? "Create New Project" : "Choose Strategy"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-600">
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
                <input aria-label="Input field"
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
                  You will choose a strategy for your project. Built-in strategies come with no
                  pre-configured scenarios — you can add your own once the project is created.
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
              {/* Strategy Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Strategy
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
                      Set your preferred default strategy for new projects.
                    </p>
                    <div className="space-y-2">
                      {allStrategies.map((strategy) => (
                        <label
                          key={strategy.id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input aria-label="Input field"
                            type="radio"
                            name="preferred-strategy"
                            checked={preferredStrategyId === strategy.id}
                            onChange={() => setPreferredStrategy(strategy.id)}
                            className="text-accent focus:ring-accent"
                          />
                          <span className="text-sm text-gray-700 flex-1">{strategy.name}</span>
                          {!strategy.isBuiltIn && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (confirm(`Delete "${strategy.name}"?`)) {
                                  deleteCustomStrategy(strategy.id);
                                }
                              }}
                              className="text-gray-500 hover:text-error"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </label>
                      ))}
                    </div>
                    {preferredStrategyId && (
                      <button
                        onClick={() => setPreferredStrategy(null)}
                        className="text-xs text-gray-500 hover:text-accent"
                      >
                        Clear preference
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <select aria-label="Select option"
                      value={selectedStrategyId}
                      onChange={(e) => setSelectedStrategyId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm appearance-none focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent bg-white"
                    >
                      {allStrategies.map((strategy) => (
                        <option key={strategy.id} value={strategy.id}>
                          {strategy.name} {strategy.isBuiltIn ? "(Built-in)" : "(Custom)"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                  </div>
                )}

                {selectedStrategy && !showSettings && (
                  <p className="text-xs text-gray-500 mt-1">{selectedStrategy.description}</p>
                )}
              </div>

              {/* Scenario Selection */}
              {!showSettings && selectedStrategy && selectedStrategy.scenarios.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Scenarios to Include
                    </label>
                    <button
                      onClick={toggleAll}
                      className="text-xs text-accent hover:underline"
                    >
                      {selectedScenarioIds.length === selectedStrategy.scenarios.length
                        ? "Deselect all"
                        : "Select all"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {selectedStrategy.scenarios.map((scenario) => (
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
                  {selectedStrategy?.isBuiltIn && selectedStrategy && selectedStrategy.scenarios.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveAsCustomStrategy}
                      disabled={selectedScenarioIds.length === 0}
                    >
                      Save as Custom
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={
                      (selectedStrategy && selectedStrategy.scenarios.length > 0 && selectedScenarioIds.length === 0) ||
                      creating
                    }
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
  scenario: StrategyScenario;
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
        <input aria-label="Input field"
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
