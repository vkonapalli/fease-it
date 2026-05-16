import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAppStore } from "~/stores/appStore";
import { BUILT_IN_PACKS, getAllPacks, createScenarioTemplate } from "~/lib/templates";
import { Button } from "~/components/ui/Button";
import {
  ArrowLeft,
  Star,
  Copy,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  Settings,
  Check,
  X,
  Package,
  List,
} from "lucide-react";
import type { TemplatePack, ScenarioTemplate, ProjectScenario } from "~/types";

const STRATEGY_OPTIONS: { value: ProjectScenario; label: string }[] = [
  { value: "sell-all", label: "Sell All Lots" },
  { value: "sell-1-hold-1", label: "Sell 1, Hold 1" },
  { value: "rental-hold", label: "Rental Hold" },
  { value: "land-plus-build", label: "Land + Build" },
  { value: "build-hold", label: "Build & Hold" },
  { value: "sda-hold", label: "SDA Hold" },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const customPacks = useAppStore((s) => s.customPacks);
  const preferredPackId = useAppStore((s) => s.preferredPackId);
  const saveCustomPack = useAppStore((s) => s.saveCustomPack);
  const deleteCustomPack = useAppStore((s) => s.deleteCustomPack);
  const setPreferredPack = useAppStore((s) => s.setPreferredPack);

  const allPacks = useMemo(() => getAllPacks(customPacks), [customPacks]);

  const [selectedPackId, setSelectedPackId] = useState<string>(allPacks[0]?.id ?? "");
  const [editingPack, setEditingPack] = useState<TemplatePack | null>(null);
  const [showAddScenario, setShowAddScenario] = useState(false);
  const [newScenarioStrategy, setNewScenarioStrategy] = useState<ProjectScenario>("sell-all");

  const selectedPack = allPacks.find((p) => p.id === selectedPackId);
  const isEditing = editingPack?.id === selectedPackId;
  const canEdit = selectedPack ? !selectedPack.isBuiltIn : false;

  function startEdit() {
    if (!selectedPack) return;
    setEditingPack(JSON.parse(JSON.stringify(selectedPack)));
  }

  function cancelEdit() {
    setEditingPack(null);
    setShowAddScenario(false);
  }

  function saveEdit() {
    if (!editingPack) return;
    saveCustomPack(editingPack);
    setEditingPack(null);
    setShowAddScenario(false);
  }

  function clonePack() {
    if (!selectedPack) return;
    const clone: TemplatePack = {
      id: `custom-${crypto.randomUUID()}`,
      name: `${selectedPack.name} (Custom)`,
      description: `Cloned from ${selectedPack.name}`,
      isBuiltIn: false,
      scenarios: selectedPack.scenarios.map((s) => ({
        ...s,
        id: `scenario-${crypto.randomUUID()}`,
      })),
    };
    saveCustomPack(clone);
    setSelectedPackId(clone.id);
  }

  function handleDeletePack() {
    if (!selectedPack || selectedPack.isBuiltIn) return;
    if (!confirm(`Delete custom pack "${selectedPack.name}"?`)) return;
    deleteCustomPack(selectedPack.id);
    setSelectedPackId(BUILT_IN_PACKS[0]?.id ?? "");
  }

  function updateEditingField<K extends keyof TemplatePack>(
    field: K,
    value: TemplatePack[K]
  ) {
    if (!editingPack) return;
    setEditingPack({ ...editingPack, [field]: value });
  }

  function updateScenarioField(
    scenarioId: string,
    field: keyof ScenarioTemplate,
    value: string
  ) {
    if (!editingPack) return;
    setEditingPack({
      ...editingPack,
      scenarios: editingPack.scenarios.map((s) =>
        s.id === scenarioId ? { ...s, [field]: value } : s
      ),
    });
  }

  function removeScenario(scenarioId: string) {
    if (!editingPack) return;
    setEditingPack({
      ...editingPack,
      scenarios: editingPack.scenarios.filter((s) => s.id !== scenarioId),
    });
  }

  function moveScenario(scenarioId: string, direction: -1 | 1) {
    if (!editingPack) return;
    const idx = editingPack.scenarios.findIndex((s) => s.id === scenarioId);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= editingPack.scenarios.length) return;

    const scenarios = [...editingPack.scenarios];
    const [removed] = scenarios.splice(idx, 1);
    scenarios.splice(newIdx, 0, removed);
    setEditingPack({ ...editingPack, scenarios });
  }

  function addScenario() {
    if (!editingPack) return;
    const template = createScenarioTemplate(newScenarioStrategy);
    setEditingPack({
      ...editingPack,
      scenarios: [...editingPack.scenarios, template],
    });
    setShowAddScenario(false);
  }

  const displayPack = isEditing ? editingPack : selectedPack;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/projects")}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Pack List */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                Template Packs
              </h2>
              <Button size="sm" variant="ghost" onClick={clonePack} disabled={!selectedPack}>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Clone
              </Button>
            </div>

            <div className="space-y-2">
              {allPacks.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => {
                    setSelectedPackId(pack.id);
                    setEditingPack(null);
                    setShowAddScenario(false);
                  }}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                    pack.id === selectedPackId
                      ? "border-accent bg-accent/5 ring-1 ring-accent"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {pack.name}
                    </span>
                    {preferredPackId === pack.id && (
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        pack.isBuiltIn
                          ? "bg-gray-100 text-gray-500"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      {pack.isBuiltIn ? "Built-in" : "Custom"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {pack.scenarios.length} scenario{pack.scenarios.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Pack Detail */}
          <div className="lg:col-span-2">
            {displayPack ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Detail Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingPack!.name}
                          onChange={(e) => updateEditingField("name", e.target.value)}
                          className="w-full text-lg font-semibold text-gray-800 border border-gray-300 rounded px-2 py-1 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        <input
                          type="text"
                          value={editingPack!.description}
                          onChange={(e) => updateEditingField("description", e.target.value)}
                          className="w-full text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800">{displayPack.name}</h2>
                        <p className="text-sm text-gray-500">{displayPack.description}</p>
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
                          variant={preferredPackId === displayPack.id ? "primary" : "ghost"}
                          onClick={() =>
                            setPreferredPack(
                              preferredPackId === displayPack.id ? null : displayPack.id
                            )
                          }
                        >
                          <Star
                            className={`h-4 w-4 mr-1 ${
                              preferredPackId === displayPack.id ? "fill-white" : ""
                            }`}
                          />
                          {preferredPackId === displayPack.id ? "Preferred" : "Set Preferred"}
                        </Button>
                        {canEdit ? (
                          <>
                            <Button size="sm" variant="ghost" onClick={startEdit}>
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleDeletePack}
                              className="text-error hover:bg-red-50"
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
                        <select
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
                    {displayPack.scenarios.map((scenario, index) => (
                      <div
                        key={scenario.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white"
                      >
                        {isEditing && (
                          <div className="flex flex-col gap-0.5 pt-1">
                            <button
                              onClick={() => moveScenario(scenario.id, -1)}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => moveScenario(scenario.id, 1)}
                              disabled={index === displayPack.scenarios.length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
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
                              <input
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
                            className="text-gray-400 hover:text-error mt-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    {displayPack.scenarios.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-8">
                        No scenarios in this pack. {isEditing ? "Add one above." : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
                <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Select a template pack to manage.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
