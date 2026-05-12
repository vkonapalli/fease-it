import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "~/components/layout/Header";
import { PropertyInputs } from "~/components/inputs/PropertyInputs";
import { TimelineInputs } from "~/components/inputs/TimelineInputs";
import { DevelopmentStrategyInputs } from "~/components/inputs/DevelopmentStrategyInputs";
import { DevelopmentInputs } from "~/components/inputs/DevelopmentInputs";
import { FinancingInputs } from "~/components/inputs/FinancingInputs";
import { RevenueInputs } from "~/components/inputs/RevenueInputs";
import { OperatingInputs } from "~/components/inputs/OperatingInputs";
import { JVInputs } from "~/components/inputs/JVInputs";
import { CashflowInputs } from "~/components/inputs/CashflowInputs";
import { BudgetVsActualInputs } from "~/components/inputs/BudgetVsActualInputs";
import { SDAInputs } from "~/components/inputs/SDAInputs";
import { CapitalStackInputs } from "~/components/inputs/CapitalStackInputs";
import { CapitalSpreadInputs } from "~/components/inputs/CapitalSpreadInputs";
import { CopyScenarioDialog } from "~/components/inputs/CopyScenarioDialog";
import { SummaryCards } from "~/components/results/SummaryCards";
import { ScenarioTabs } from "~/components/results/ScenarioTabs";
import { ComparisonTable } from "~/components/results/ComparisonTable";
import { SensitivityAnalysis } from "~/components/results/SensitivityAnalysis";
import { CostBreakdownChart } from "~/components/results/CostBreakdownChart";
import { CashflowTable } from "~/components/results/CashflowTable";
import { JVSummary } from "~/components/results/JVSummary";
import { BudgetVsActualTable } from "~/components/results/BudgetVsActualTable";
import { YearlyProjectionTable } from "~/components/results/YearlyProjectionTable";
import { SDAResults } from "~/components/results/SDAResults";
import { ScenarioComparison } from "~/components/results/ScenarioComparison";
import { DeficitCard } from "~/components/results/DeficitCard";
import { useAppStore } from "~/stores/appStore";
import { calculateFeasibility } from "~/lib/calculations";
import { getScenarios, createScenario, updateScenario, deleteScenario } from "~/services/projectService";
import type { Scenario as AppScenario } from "~/stores/appStore";
import { Plus, Loader2, Copy } from "lucide-react";
import { Button } from "~/components/ui/Button";

export default function Home() {
  const navigate = useNavigate();
  const projectId = useAppStore((s) => s.projectId);
  const scenarios = useAppStore((s) => s.scenarios);
  const activeScenarioId = useAppStore((s) => s.activeScenarioId);
  const setScenarios = useAppStore((s) => s.setScenarios);
  const setActiveScenario = useAppStore((s) => s.setActiveScenario);
  const addScenario = useAppStore((s) => s.addScenario);
  const removeScenario = useAppStore((s) => s.removeScenario);
  const updateScenarioLocal = useAppStore((s) => s.updateScenario);
  const duplicateScenarioWithOptions = useAppStore((s) => s.duplicateScenarioWithOptions);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copyDialogId, setCopyDialogId] = useState<string | null>(null);

  // Redirect if no project selected
  useEffect(() => {
    if (!projectId) {
      navigate("/projects");
    }
  }, [projectId, navigate]);

  // Load scenarios from Supabase
  useEffect(() => {
    if (!projectId) return;
    const pid = projectId;

    async function load() {
      try {
        const remoteScenarios = await getScenarios(pid);
        if (remoteScenarios.length > 0) {
          const mapped: AppScenario[] = remoteScenarios.map((rs) => ({
            id: rs.id,
            name: rs.name,
            inputs: rs.inputs,
            sortOrder: rs.sort_order,
            synced: true,
            remoteId: rs.id,
          }));
          setScenarios(mapped);
          setActiveScenario(mapped[0].id);
        }
      } catch (err) {
        console.error("Failed to load scenarios:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [projectId, setScenarios, setActiveScenario]);

  // Auto-save scenarios to Supabase (debounced)
  useEffect(() => {
    if (!projectId) return;

    const timeout = setTimeout(async () => {
      const unsynced = scenarios.filter((s) => !s.synced);
      if (unsynced.length === 0) return;

      setSaving(true);
      try {
        for (const s of unsynced) {
          if (s.remoteId) {
            await updateScenario(s.remoteId, {
              name: s.name,
              inputs: s.inputs,
            });
          } else {
            const created = await createScenario(projectId, s.name, s.inputs, s.sortOrder);
            updateScenarioLocal(s.id, { remoteId: created.id, synced: true });
          }
        }
        // Mark all as synced
        setScenarios(
          scenarios.map((s) => ({ ...s, synced: true }))
        );
      } catch (err) {
        console.error("Auto-save failed:", err);
      } finally {
        setSaving(false);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [scenarios, projectId, setScenarios, updateScenarioLocal]);

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0] ?? null,
    [scenarios, activeScenarioId]
  );

  const inputs = activeScenario?.inputs;

  const results = useMemo(() => {
    if (!inputs) return null;
    return calculateFeasibility(inputs);
  }, [inputs]);

  const isSDA = inputs?.scenario === "sda-hold";
  const activeResult = results?.scenarios.find((s) => s.scenario === results.activeScenario);

  async function handleAddScenario() {
    if (!projectId) return;
    if (scenarios.length >= 20) {
      alert("Maximum 20 scenarios allowed.");
      return;
    }
    const source = activeScenario ?? scenarios[0];
    const newScenario: AppScenario = {
      id: crypto.randomUUID(),
      name: `Scenario ${scenarios.length + 1}`,
      inputs: source
        ? { ...source.inputs, name: `Scenario ${scenarios.length + 1}` }
        : ({} as AppScenario["inputs"]),
      sortOrder: Math.max(...scenarios.map((s) => s.sortOrder), 0) + 1,
      synced: false,
      remoteId: null,
    };
    addScenario(newScenario);
  }

  async function handleDeleteScenario(id: string) {
    if (scenarios.length <= 1) {
      alert("You must keep at least one scenario.");
      return;
    }
    const scenario = scenarios.find((s) => s.id === id);
    if (scenario?.remoteId) {
      try {
        await deleteScenario(scenario.remoteId);
      } catch (err) {
        console.error("Failed to delete remote scenario:", err);
      }
    }
    removeScenario(id);
  }

  async function handleRenameScenario(id: string, name: string) {
    updateScenarioLocal(id, { name });
  }

  function handleCopyScenario(id: string, name: string, options: Parameters<typeof duplicateScenarioWithOptions>[2]) {
    duplicateScenarioWithOptions(id, name, options);
    setCopyDialogId(null);
  }

  if (!projectId) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const copySource = copyDialogId ? scenarios.find((s) => s.id === copyDialogId) ?? null : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Scenario Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {scenarios.map((s) => (
            <div
              key={s.id}
              className={`group flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap transition-colors ${
                s.id === activeScenarioId
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setActiveScenario(s.id)}
            >
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleRenameScenario(s.id, e.currentTarget.textContent || s.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
              >
                {s.name}
              </span>
              {/* Copy button */}
              <button
                className="ml-1 text-xs opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                title="Copy scenario"
                onClick={(e) => {
                  e.stopPropagation();
                  setCopyDialogId(s.id);
                }}
              >
                <Copy className="h-3 w-3" />
              </button>
              {scenarios.length > 1 && (
                <button
                  className="ml-1 text-xs opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${s.name}"?`)) {
                      handleDeleteScenario(s.id);
                    }
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAddScenario}
            disabled={scenarios.length >= 20}
            className="whitespace-nowrap"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
          {saving && <span className="text-xs text-gray-400 ml-auto">Saving...</span>}
        </div>
      </div>

      {/* Copy Scenario Dialog */}
      {copySource && (
        <CopyScenarioDialog
          sourceName={copySource.name}
          onConfirm={(name, options) => handleCopyScenario(copySource.id, name, options)}
          onCancel={() => setCopyDialogId(null)}
        />
      )}

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Input Panel */}
          <div className="space-y-4">
            {isSDA ? (
              <SDAInputs />
            ) : (
              <>
                <PropertyInputs />
                <TimelineInputs />
                <DevelopmentStrategyInputs />
                <DevelopmentInputs />
                <FinancingInputs />
                <CapitalStackInputs />
                <CapitalSpreadInputs />
                <RevenueInputs />
                <OperatingInputs />
                <JVInputs />
                <CashflowInputs />
                <BudgetVsActualInputs />
              </>
            )}
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            <ScenarioComparison />
            {isSDA ? (
              <SDAResults sdaConfig={inputs?.sda} />
            ) : activeResult && results ? (
              <>
                <SummaryCards results={activeResult} />
                <DeficitCard
                  deficit={activeResult.deficit}
                  totalProjectCost={activeResult.totalProjectCost}
                  seniorDebtAmount={activeResult.seniorDebtAmount}
                  mezzanineDebtAmount={activeResult.mezzanineDebtAmount}
                  privateLendingAmount={activeResult.privateLendingAmount}
                  committedCapital={activeResult.committedCapital}
                />
                <ScenarioTabs scenarios={results.scenarios} activeScenario={results.activeScenario} />
                <ComparisonTable comparison={activeResult.comparison} />
                <CostBreakdownChart costs={activeResult.costBreakdown} />
                <JVSummary jv={activeResult.jv} />
                <CashflowTable cashflow={activeResult.cashflow} />
                <YearlyProjectionTable projections={activeResult.yearlyProjections} />
                <SensitivityAnalysis sensitivity={activeResult.sensitivity} />
                <BudgetVsActualTable budgetVsActual={results.budgetVsActual} />
              </>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
