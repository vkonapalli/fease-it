import { useState, useMemo } from "react";
import { useAppStore } from "~/stores/appStore";
import { BUILT_IN_STRATEGIES, getAllStrategies, createStrategyScenario } from "~/lib/templates";
import { Button } from "~/components/ui/Button";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/settings";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Settings | Fease It" }
  ];
};

import {
  Star,
  Copy,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  Package,
  List,
} from "lucide-react";
import type { Strategy, StrategyScenario, ProjectScenario } from "@fease-it/schemas";

const STRATEGY_OPTIONS: { value: ProjectScenario; label: string }[] = [
  { value: "build-sell", label: "Build & Sell" },
  { value: "sell-1-hold-1", label: "Sell 1, Hold 1" },
  { value: "rental-hold", label: "Rental Hold" },
  { value: "land-plus-build", label: "Land + Build" },
  { value: "build-hold", label: "Build & Hold" },
  { value: "sda-hold", label: "SDA Hold" },
];

export default function SettingsPage() {
  const customStrategies = useAppStore((s) => s.customStrategies);
  const preferredStrategyId = useAppStore((s) => s.preferredStrategyId);
  const saveCustomStrategy = useAppStore((s) => s.saveCustomStrategy);
  const deleteCustomStrategy = useAppStore((s) => s.deleteCustomStrategy);
  const setPreferredStrategy = useAppStore((s) => s.setPreferredStrategy);

  const allStrategies = useMemo(() => getAllStrategies(customStrategies), [customStrategies]);

  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(allStrategies[0]?.id ?? "");
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [showAddScenario, setShowAddScenario] = useState(false);
  const [newScenarioStrategy, setNewScenarioStrategy] = useState<ProjectScenario>("build-sell");

  const selectedStrategy = allStrategies.find((p) => p.id === selectedStrategyId);
  const isEditing = editingStrategy?.id === selectedStrategyId;
  const canEdit = selectedStrategy ? !selectedStrategy.isBuiltIn : false;

  function startEdit() {
    if (!selectedStrategy) return;
    setEditingStrategy(JSON.parse(JSON.stringify(selectedStrategy)));
  }

  function cancelEdit() {
    setEditingStrategy(null);
    setShowAddScenario(false);
  }

  function saveEdit() {
    if (!editingStrategy) return;
    saveCustomStrategy(editingStrategy);
    setEditingStrategy(null);
    setShowAddScenario(false);
  }

  function cloneStrategy() {
    if (!selectedStrategy) return;
    const clone: Strategy = {
      id: `custom-${crypto.randomUUID()}`,
      name: `${selectedStrategy.name} (Custom)`,
      description: `Cloned from ${selectedStrategy.name}`,
      isBuiltIn: false,
      scenarios: selectedStrategy.scenarios.map((s) => ({
        ...s,
        id: `scenario-${crypto.randomUUID()}`,
      })),
    };
    saveCustomStrategy(clone);
    setSelectedStrategyId(clone.id);
  }

  function handleDeleteStrategy() {
    if (!selectedStrategy || selectedStrategy.isBuiltIn) return;
    if (!confirm(`Delete custom strategy "${selectedStrategy.name}"?`)) return;
    deleteCustomStrategy(selectedStrategy.id);
    setSelectedStrategyId(BUILT_IN_STRATEGIES[0]?.id ?? "");
  }

  function updateEditingField<K extends keyof Strategy>(
    field: K,
    value: Strategy[K]
  ) {
    if (!editingStrategy) return;
    setEditingStrategy({ ...editingStrategy, [field]: value });
  }

  function updateScenarioField(
    scenarioId: string,
    field: keyof StrategyScenario,
    value: string
  ) {
    if (!editingStrategy) return;
    setEditingStrategy({
      ...editingStrategy,
      scenarios: editingStrategy.scenarios.map((s) =>
        s.id === scenarioId ? { ...s, [field]: value } : s
      ),
    });
  }

  function removeScenario(scenarioId: string) {
    if (!editingStrategy) return;
    setEditingStrategy({
      ...editingStrategy,
      scenarios: editingStrategy.scenarios.filter((s) => s.id !== scenarioId),
    });
  }

  function moveScenario(scenarioId: string, direction: -1 | 1) {
    if (!editingStrategy) return;
    const idx = editingStrategy.scenarios.findIndex((s) => s.id === scenarioId);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= editingStrategy.scenarios.length) return;

    const scenarios = [...editingStrategy.scenarios];
    const [removed] = scenarios.splice(idx, 1);
    scenarios.splice(newIdx, 0, removed);
    setEditingStrategy({ ...editingStrategy, scenarios });
  }

  function addScenario() {
    if (!editingStrategy) return;
    const template = createStrategyScenario(newScenarioStrategy);
    setEditingStrategy({
      ...editingStrategy,
      scenarios: [...editingStrategy.scenarios, template],
    });
    setShowAddScenario(false);
  }

  const displayStrategy = isEditing ? editingStrategy : selectedStrategy;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Pack List */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                Strategies
              </h2>
              <Button size="sm" variant="ghost" onClick={cloneStrategy} disabled={!selectedStrategy}>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Clone
              </Button>
            </div>

            <div className="space-y-2">
              {allStrategies.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => {
                    setSelectedStrategyId(strategy.id);
                    setEditingStrategy(null);
                    setShowAddScenario(false);
                  }}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                    strategy.id === selectedStrategyId
                      ? "border-accent bg-accent/5 ring-1 ring-accent"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {strategy.name}
                    </span>
                    {preferredStrategyId === strategy.id && (
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        strategy.isBuiltIn
                          ? "bg-gray-100 text-gray-500"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      {strategy.isBuiltIn ? "Built-in" : "Custom"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {strategy.scenarios.length} scenario{strategy.scenarios.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Strategy Detail */}
          <div className="lg:col-span-2">
            {displayStrategy ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Detail Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input aria-label="Input field"
                          type="text"
                          value={editingStrategy!.name}
                          onChange={(e) => updateEditingField("name", e.target.value)}
                          className="w-full text-lg font-semibold text-gray-800 border border-gray-300 rounded px-2 py-1 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        <input aria-label="Input field"
                          type="text"
                          value={editingStrategy!.description}
                          onChange={(e) => updateEditingField("description", e.target.value)}
                          className="w-full text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800">{displayStrategy.name}</h2>
                        <p className="text-sm text-gray-500">{displayStrategy.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {isEditing ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={saveEdit}>
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant={preferredStrategyId === displayStrategy.id ? "primary" : "ghost"}
                          onClick={() =>
                            setPreferredStrategy(
                              preferredStrategyId === displayStrategy.id ? null : displayStrategy.id
                            )
                          }
                        >
                          <Star
                            className={`h-4 w-4 mr-1 ${
                              preferredStrategyId === displayStrategy.id ? "fill-white" : ""
                            }`}
                          />
                          {preferredStrategyId === displayStrategy.id ? "Preferred" : "Set Preferred"}
                        </Button>
                        {canEdit ? (
                          <>
                            <Button size="sm" variant="ghost" onClick={startEdit}>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleDeleteStrategy}
                              aria-label="Delete project" className="text-error hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={startEdit}>
                            Edit as Custom
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Scenarios List */}
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <List className="h-4 w-4" />
                      Scenarios
                    </h3>
                    {isEditing && (
                      <Button size="sm" variant="ghost" onClick={() => setShowAddScenario(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Scenario
                      </Button>
                    )}
                  </div>

                  {showAddScenario && isEditing && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <select aria-label="Select option"
                          value={newScenarioStrategy}
                          onChange={(e) => setNewScenarioStrategy(e.target.value as ProjectScenario)}
                          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent bg-white"
                        >
                          {STRATEGY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <Button size="sm" onClick={addScenario}>
                          Add
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowAddScenario(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {displayStrategy.scenarios.map((scenario, index) => (
                      <div
                        key={scenario.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white"
                      >
                        {isEditing && (
                          <div className="flex flex-col gap-0.5 pt-1">
                            <button
                              onClick={() => moveScenario(scenario.id, -1)}
                              disabled={index === 0}
                              className="text-gray-500 hover:text-gray-600 disabled:opacity-30"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => moveScenario(scenario.id, 1)}
                              disabled={index === displayStrategy.scenarios.length - 1}
                              className="text-gray-500 hover:text-gray-600 disabled:opacity-30"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input aria-label="Input field"
                                  type="text"
                                  value={scenario.name}
                                  onChange={(e) =>
                                    updateScenarioField(scenario.id, "name", e.target.value)
                                  }
                                  className="flex-1 text-sm font-medium text-gray-800 border border-gray-300 rounded px-2 py-1 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                                />
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize whitespace-nowrap">
                                  {scenario.strategy.replace(/-/g, " ")}
                                </span>
                              </div>
                              <input aria-label="Input field"
                                type="text"
                                value={scenario.description}
                                onChange={(e) =>
                                  updateScenarioField(scenario.id, "description", e.target.value)
                                }
                                className="w-full text-xs text-gray-500 border border-gray-300 rounded px-2 py-1 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-800">
                                  {scenario.name}
                                </span>
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
                                  {scenario.strategy.replace(/-/g, " ")}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{scenario.description}</p>
                            </div>
                          )}
                        </div>

                        {isEditing && (
                          <button
                            onClick={() => removeScenario(scenario.id)}
                            className="text-gray-500 hover:text-error mt-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    {displayStrategy.scenarios.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-8">
                        No scenarios in this strategy. {isEditing ? "Add one above." : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
                <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Select a strategy to manage.</p>
              </div>
            )}
          </div>
        </div>
    </main>
  );
}
