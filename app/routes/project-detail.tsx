import { debounce, isEqual } from "~/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import { useNavigate, useParams, useFetcher, useLoaderData, redirect, useSubmit, useNavigation } from "react-router";
import type { Route } from "./+types/project-detail";
import { parseRequestData, validateOrigin } from "~/lib/utils.server";
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
import { FeasibilityTable } from "~/components/results/FeasibilityTable";
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
import { isSupabaseConfigured } from "~/lib/supabase/client";
import { requireAuth } from "~/lib/auth.server";
import { ScenarioActionSchema } from "~/lib/schemas";
import * as db from "~/lib/db.server";
import { createBaseInputs } from "~/lib/templates";
import type { Scenario as AppScenario } from "~/stores/appStore";
import { Plus, Loader2, Copy } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { AIChat } from "~/components/AIChat";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FeasibilityInputsSchema } from "~/lib/schemas";
import type { FeasibilityInputs } from "~/types";

function parseScenarioFromSplat(splat: string | undefined): string | undefined {
  if (!splat) return undefined;
  const match = splat.match(/^scenarios\/([^/]+)/);
  return match ? match[1] : undefined;
}

interface LoaderData {
  project: { id: string; name: string } | null;
  scenarios: AppScenario[];
  localOnly: boolean;
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const projectId = params.projectId;
  if (!projectId) throw redirect("/projects");

  if (!isSupabaseConfigured()) {
    return { project: null, scenarios: [], localOnly: true } as LoaderData;
  }

  const { user, headers } = await requireAuth(request);
  if (!user) {
    throw redirect("/login", { headers });
  }

  // Verify project ownership before querying scenarios
  const project = await db.getProject(request, user.id, projectId);
  if (!project) {
    throw redirect("/projects");
  }

  const scenarios = await db.getScenarios(request, user.id, projectId);

  // Deduplicate scenarios from DB just in case of dirty data
  const uniqueScenarios = [];
  const seenIds = new Set();
  for (const s of scenarios) {
    if (!seenIds.has(s.id)) {
      seenIds.add(s.id);
      uniqueScenarios.push(s);
    }
  }

  return {
    project: { id: project.id, name: project.name },
    scenarios: uniqueScenarios.map((s) => ({
      id: s.id,
      name: s.name,
      inputs: s.inputs,
      sortOrder: s.sort_order,
      synced: true,
      remoteId: s.id,
    })),
    localOnly: false,
  };
}

type ActionData =
  | { error: string; details?: Record<string, unknown> }
  | { ok: true; scenario?: Record<string, unknown>; id?: string; intent?: string };

export async function action({ request, params }: Route.ActionArgs) {
  const projectId = params.projectId;
  if (!projectId) return { error: "Missing projectId" };

  if (request.method !== "GET" && !validateOrigin(request)) {
    return { error: "Invalid origin" };
  }

  const rawData = await parseRequestData(request);
  const submission = ScenarioActionSchema.safeParse(rawData);

  if (!submission.success) {
    return { error: "Invalid submission", details: submission.error.format() };
  }

  const { intent, id, name } = submission.data;
  let inputs: unknown = submission.data.inputs;

  // Handle both stringified (from FormData) and object (from JSON) inputs
  if (typeof inputs === "string") {
    try {
      inputs = JSON.parse(inputs);
    } catch (e) {
      // ignore
    }
  }

  if (!isSupabaseConfigured()) {
    // Local fallback logic (could be improved, but handles the non-DB case)
    return { ok: true };
  }

  const { user } = await requireAuth(request);
  if (!user) throw redirect("/login");

  try {
    if (intent === "delete-scenario" && id) {
      await db.deleteScenario(request, user.id, id, projectId);
      const remaining = await db.getScenarios(request, user.id, projectId);
      if (remaining && remaining.length > 0) {
         return redirect(`/projects/${projectId}/scenarios/${remaining[0].id}`);
      }
      return redirect(`/projects/${projectId}`);
    }

    if (intent === "create-scenario" && name && inputs) {
      const localId = (rawData as Record<string, unknown>).localId as string | undefined;
      const scenario = await db.createScenario(
        request,
        user.id,
        projectId,
        name,
        inputs as FeasibilityInputs,
        0, // sortOrder should be calculated or passed
        localId
      );
      
      // If it was submitted via background fetcher (no navigation intended), return JSON
      if (request.headers.get("X-Remix-Fetch") === "yes" || request.headers.get("Sec-Fetch-Mode") === "cors") {
        return { ok: true, scenario, id: scenario.id, intent: "create-scenario" };
      }
      return redirect(`/projects/${projectId}/scenarios/${scenario.id}`);
    }

    if (intent === "rename-scenario" && id && name) {
      await db.updateScenario(request, user.id, projectId, id, { name });
      return { ok: true, id, intent };
    }

    if (intent === "update-scenario" && id && inputs) {
      await db.updateScenario(request, user.id, projectId, id, { inputs: inputs as FeasibilityInputs });
      return { ok: true, id, intent };
    }

    if (intent === "duplicate-scenario" && id && name && inputs) {
      const scenario = await db.createScenario(
        request,
        user.id,
        projectId,
        name,
        inputs as FeasibilityInputs,
        0 // sortOrder
      );
      return redirect(`/projects/${projectId}/scenarios/${scenario.id}`);
    }
  } catch (err: any) {
    return { error: err.message };
  }

  return { error: "Unknown intent" };
}

export default function ProjectDetail({ loaderData }: Route.ComponentProps) {
  const { projectId, "*": splat } = useParams();
  const { project, scenarios: initialScenarios, localOnly } = loaderData;
  const navigate = useNavigate();
  const fetcher = useFetcher<ActionData>();
  const submit = useSubmit();

  const setProject = useAppStore((s) => s.setProject);
  const projectName = useAppStore((s) => s.projectName);
  const storeProjectId = useAppStore((s) => s.projectId);
  const scenarios = useAppStore((s) => s.scenarios);
  const activeScenarioId = useAppStore((s) => s.activeScenarioId);
  const setScenarios = useAppStore((s) => s.setScenarios);
  const setActiveScenario = useAppStore((s) => s.setActiveScenario);
  const hydrateFromServer = useAppStore((s) => s.hydrateFromServer);
  const hasHydrated = useAppStore((s) => s._hasHydrated);
  const addScenario = useAppStore((s) => s.addScenario);
  const removeScenario = useAppStore((s) => s.removeScenario);
  const updateScenarioLocal = useAppStore((s) => s.updateScenario);
  const markScenarioSynced = useAppStore((s) => s.markScenarioSynced);
  const duplicateScenarioWithOptions = useAppStore((s) => s.duplicateScenarioWithOptions);

  const [copyDialogId, setCopyDialogId] = useState<string | null>(null);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const scenarioFromUrl = parseScenarioFromSplat(splat);
  const initialised = useRef(false);

  const isStoreReady = hasHydrated && storeProjectId === project?.id;
  const baseScenarios = isStoreReady ? scenarios : initialScenarios;
  const currentActiveId = isStoreReady ? activeScenarioId : (scenarioFromUrl || initialScenarios[0]?.id);

  const activeScenario = useMemo(
    () => baseScenarios.find((s) => s.id === currentActiveId) ?? baseScenarios[0] ?? null,
    [baseScenarios, currentActiveId]
  );

  const methods = useForm<FeasibilityInputs>({
    defaultValues: activeScenario?.inputs,
    resolver: zodResolver(FeasibilityInputsSchema),
    mode: "onChange",
  });

  const { watch, reset } = methods;
  const formValues = watch();

  // Reset form when switching scenarios OR when external updates happen (e.g. AI Chat)
  const lastResetId = useRef<string | null>(null);
  const lastInputsRef = useRef<FeasibilityInputs | null>(null);
  const lastFormValuesRef = useRef<FeasibilityInputs | null>(null);

  useEffect(() => {
    if (!activeScenario) return;

    const idChanged = activeScenario.id !== lastResetId.current;
    const inputsChanged = !isEqual(activeScenario.inputs, lastInputsRef.current);

    // Prevent reset from fighting with our own auto-save updates.
    // If the inputs changed but they match the last values we saw from the form,
    // this update came from the user typing, not an external source (e.g. AI chat).
    const isFromForm =
      lastFormValuesRef.current &&
      isEqual(activeScenario.inputs, lastFormValuesRef.current);
    if (!idChanged && isFromForm) return;

    if (idChanged || inputsChanged) {
      reset(activeScenario.inputs);
      lastResetId.current = activeScenario.id;
      lastInputsRef.current = activeScenario.inputs;
      lastFormValuesRef.current = activeScenario.inputs;
    }
  }, [activeScenario, reset]);

  const handleNavigateScenario = useCallback(
    (sid: string) => {
      navigate(`/projects/${projectId}/scenarios/${sid}`, { replace: true });
    },
    [projectId, navigate]
  );

  // Hydrate Zustand from server data on mount / when project changes
  useEffect(() => {
    if (project && initialScenarios.length > 0) {
      hydrateFromServer(project.id, project.name, initialScenarios);
    }
  }, [project, initialScenarios, hydrateFromServer]);

  // Select scenario from URL or default to first
  useEffect(() => {
    if (scenarios.length === 0) return;
    
    if (scenarioFromUrl) {
      const found = scenarios.find((s) => s.id === scenarioFromUrl);
      if (found) {
        // Only set active if different to avoid redundant updates
        if (activeScenarioId !== scenarioFromUrl) {
          setActiveScenario(scenarioFromUrl);
        }
      } else if (hasHydrated || localOnly) {
        // If the ID in the URL is not found, it might be a newly added local-only scenario
        // that hasn't been hydrated yet, or it's genuinely missing.
        // If we have hydrated and it's still missing, then we fall back.
        setActiveScenario(scenarios[0].id);
        handleNavigateScenario(scenarios[0].id);
      }
    } else if (!initialised.current && (hasHydrated || localOnly)) {
      setActiveScenario(scenarios[0].id);
      handleNavigateScenario(scenarios[0].id);
    }
    initialised.current = true;
  }, [scenarios, scenarioFromUrl, activeScenarioId, setActiveScenario, handleNavigateScenario, hasHydrated, localOnly]);

  // Debounced server sync
  const debouncedSave = useCallback(
    debounce((id: string, remoteId: string | null, name: string, currentInputs: FeasibilityInputs) => {
      if (localOnly) return;
      if (remoteId) {
        fetcher.submit(
          {
            intent: "update-scenario",
            id: remoteId,
            inputs: currentInputs,
          } as any,
          { method: "post", encType: "application/json" }
        );
      } else {
        fetcher.submit(
          {
            intent: "create-scenario",
            name,
            inputs: currentInputs,
            localId: id,
          } as any,
          { method: "post", encType: "application/json" }
        );
      }
    }, 2000),
    [fetcher, localOnly]
  );

  // Auto-save via RHF subscription (trackhub-web pattern).
  // We use form.watch(callback) instead of watch() in render + useEffect.
  // This avoids a circular dependency: watch() -> render -> useEffect ->
  // updateScenarioLocal -> new scenarios array -> activeScenario ref change ->
  // reset effect -> reset() -> watch() trigger -> render -> useEffect again.
  useEffect(() => {
    const subscription = methods.watch((data) => {
      if (!activeScenarioId) return;

      const state = useAppStore.getState();
      const currentScenario = state.scenarios.find(
        (s) => s.id === activeScenarioId
      );
      if (!currentScenario) return;

      // Track that this change came from the form itself.
      lastFormValuesRef.current = data as FeasibilityInputs;

      if (!isEqual(data, currentScenario.inputs)) {
        updateScenarioLocal(activeScenarioId, {
          inputs: data as FeasibilityInputs,
        });
        debouncedSave(
          activeScenarioId,
          currentScenario.remoteId,
          currentScenario.name,
          data as FeasibilityInputs
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [methods, activeScenarioId, updateScenarioLocal, debouncedSave]);

  // Handle successful background auto-save responses
  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    const resp = fetcher.data;
    if ("ok" in resp && resp.ok) {
      const intent = resp.intent;
      const id = resp.id;
      if (intent === "create-scenario" && id) {
        markScenarioSynced(id, id);
      } else if (intent === "update-scenario" && id && activeScenarioId) {
        markScenarioSynced(activeScenarioId, id);
      }
    }
  }, [fetcher.state, fetcher.data, markScenarioSynced, activeScenarioId]);

  const deferredFormValues = useDeferredValue(formValues);

  const results = useMemo(() => {
    if (!deferredFormValues || Object.keys(deferredFormValues).length === 0) return null;
    return calculateFeasibility(deferredFormValues);
  }, [deferredFormValues]);

  const isSDA = deferredFormValues?.scenario === "sda-hold";
  const activeResult = results?.scenarios.find((s) => s.scenario === results.activeScenario);

  // Deriving saving state from React Router
  const { state: navigationState, formData: navigationFormData } = useNavigation();
  const isGlobalSaving = navigationState !== "idle" && ["create-scenario", "duplicate-scenario", "delete-scenario"].includes(navigationFormData?.get("intent") as string);
  const isAutoSaving = fetcher.state !== "idle" && fetcher.formData?.get("intent") === "update-scenario";
  const saving = isGlobalSaving || isAutoSaving;

  function handleAddScenario() {
    if (!projectId) return;
    if (scenarios.length >= 20) {
      alert("Maximum 20 scenarios allowed.");
      return;
    }
    const source = activeScenario ?? scenarios[0];
    const newName = `Scenario ${scenarios.length + 1}`;
    const newInputs = source
      ? structuredClone({ ...source.inputs, name: newName }) as AppScenario["inputs"]
      : ({} as AppScenario["inputs"]);
    
    if (localOnly) {
       // Local fallback
       const newId = crypto.randomUUID();
       const newScenario: AppScenario = {
         id: newId,
         name: newName,
         inputs: newInputs,
         sortOrder: Math.max(...scenarios.map((s) => s.sortOrder), 0) + 1,
         synced: false,
         remoteId: null,
       };
       addScenario(newScenario);
       handleNavigateScenario(newId);
       return;
    }

    submit(
      {
        intent: "create-scenario",
        name: newName,
        inputs: newInputs,
      } as any,
      { method: "post", encType: "application/json" }
    );
  }

  async function handleDeleteScenario(id: string) {
    if (scenarios.length <= 1) {
      alert("You must keep at least one scenario.");
      return;
    }
    const scenario = scenarios.find((s) => s.id === id);
    if (localOnly || !scenario?.remoteId) {
        removeScenario(id);
        return;
    }
    
    // Server deletion
    submit(
      {
        intent: "delete-scenario",
        id: scenario.remoteId,
      },
      { method: "post", encType: "application/json" }
    );
  }

  function handleRenameScenario(id: string, name: string) {
    updateScenarioLocal(id, { name });
  }

  function handleScenarioSelect(id: string) {
    if (id === activeScenarioId) return;
    setActiveScenario(id);
    handleNavigateScenario(id);
  }

  function handleCopyScenario(
    id: string,
    name: string,
    options: Parameters<typeof duplicateScenarioWithOptions>[2]
  ) {
    const source = scenarios.find(s => s.id === id);
    if (!source) return;
    
    setCopyDialogId(null);
    
    if (localOnly) {
       duplicateScenarioWithOptions(id, name, options);
       // The store updates synchronously, we can find the newly created scenario by assuming it's the last one
       const state = useAppStore.getState();
       const last = state.scenarios[state.scenarios.length - 1];
       if (last) {
         handleNavigateScenario(last.id);
       }
       return;
    }
    
    // We need to calculate the duplicated inputs since the server just saves them
    // It's cleaner to duplicate the logic here or pass the options to the server.
    // For now, let's use the local store's utility to get the inputs, then send them.
    const defs = createBaseInputs();
    const src = source.inputs;
    const newInputs = {
        name,
        scenario: src.scenario,
        property: options.copyProperty ? src.property : defs.property,
        development: options.copyDevelopment
          ? src.development
          : { ...defs.development, timeline: src.development.timeline },
        financing: options.copyFinancing ? src.financing : defs.financing,
        revenue: options.copyRevenue ? src.revenue : defs.revenue,
        operating: options.copyOperating ? src.operating : defs.operating,
        jv: options.copyJV ? src.jv : defs.jv,
        cashflow: options.copyCashflow ? src.cashflow : defs.cashflow,
        budgetVsActual: options.copyBudget ? src.budgetVsActual : defs.budgetVsActual,
        sda: src.sda,
        capitalStack: options.copyFinancing ? src.capitalStack : defs.capitalStack,
        capitalSpread: options.copyCashflow ? src.capitalSpread : defs.capitalSpread,
      };
      
    submit(
      {
        intent: "duplicate-scenario",
        name,
        inputs: newInputs,
      } as any,
      { method: "post", encType: "application/json" }
    );
  }

  // Optimistic delete state
  const isDeleting = (navigationState !== "idle" && navigationFormData?.get("intent") === "delete-scenario") || 
                     (fetcher.state !== "idle" && fetcher.formData?.get("intent") === "delete-scenario");
  const deletingId = isDeleting ? ((navigationFormData?.get("id") || fetcher.formData?.get("id")) as string) : null;
  const displayScenarios = useMemo(() => {
    const filtered = deletingId 
      ? baseScenarios.filter((s) => s.id !== deletingId && s.remoteId !== deletingId) 
      : baseScenarios;
    // Defensive: deduplicate by id to prevent duplicate key warnings.
    // If duplicates exist it indicates a store bug; deduplication keeps UI stable.
    const seen = new Set<string>();
    return filtered.filter((s) => {
      if (seen.has(s.id)) {
        console.warn("Duplicate scenario id detected:", s.id, s.name);
        return false;
      }
      seen.add(s.id);
      return true;
    });
  }, [baseScenarios, deletingId]);

  const copySource = copyDialogId ? displayScenarios.find((s) => s.id === copyDialogId) ?? null : null;

  return (
    <FormProvider {...methods}>
      {/* Scenario Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {displayScenarios.map((s) => (
            <button
              type="button"
              key={s.id}
              className={`group flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap transition-colors ${
                s.id === currentActiveId
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => handleScenarioSelect(s.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleScenarioSelect(s.id);
                }
              }}
            >
              {editingScenarioId === s.id ? (
                <input
                  type="text"
                  autoFocus
                  defaultValue={s.name}
                  size={Math.max(s.name.length, 5)}
                  className="bg-transparent border-none outline-none p-0 m-0 text-inherit focus:ring-0 max-w-[150px]"
                  onBlur={(e) => {
                    handleRenameScenario(s.id, e.target.value.trim() || s.name);
                    setEditingScenarioId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    } else if (e.key === "Escape") {
                      setEditingScenarioId(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingScenarioId(s.id);
                  }}
                  className="truncate max-w-[150px]"
                  title="Double click to rename"
                >
                  {s.name}
                </span>
              )}
              <div
                className="ml-1 text-xs opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                title="Copy scenario"
                onClick={(e) => {
                  e.stopPropagation();
                  setCopyDialogId(s.id);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    setCopyDialogId(s.id);
                  }
                }}
              >
                <Copy className="h-3 w-3" />
              </div>
              {displayScenarios.length > 1 && (
                <div
                  className="ml-1 text-xs opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${s.name}"?`)) {
                      handleDeleteScenario(s.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm(`Delete "${s.name}"?`)) {
                        handleDeleteScenario(s.id);
                      }
                    }
                  }}
                >
                  ×
                </div>
              )}
            </button>
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

      {copySource && (
        <CopyScenarioDialog
          sourceName={copySource.name}
          onConfirm={(name, options) => handleCopyScenario(copySource.id, name, options)}
          onCancel={() => setCopyDialogId(null)}
        />
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 relative">
        {isGlobalSaving && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-xl">
            <div className="flex flex-col items-center gap-2 text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm font-medium">Saving scenario...</span>
            </div>
          </div>
        )}
        <div className={`grid gap-6 grid-cols-1 lg:grid-cols-2 transition-opacity ${isGlobalSaving ? 'opacity-50 pointer-events-none' : ''}`}>
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

          <div className="space-y-4">
            {isSDA ? (
              <SDAResults sdaConfig={formValues?.sda} />
            ) : activeResult && results ? (
              <>
                <SummaryCards results={activeResult} />
                <FeasibilityTable result={activeResult} />
                <DeficitCard
                  deficit={activeResult.deficit}
                  totalProjectCost={activeResult.totalProjectCost}
                  seniorDebtAmount={activeResult.seniorDebtAmount}
                  mezzanineDebtAmount={activeResult.mezzanineDebtAmount}
                  privateLendingAmount={activeResult.privateLendingAmount}
                  committedCapital={activeResult.committedCapital}
                />
                
                {scenarios.length > 1 && <ScenarioComparison />}
                
                <ScenarioTabs scenarios={results.scenarios} activeScenario={results.activeScenario} />
                <CostBreakdownChart costs={activeResult.costBreakdown} />
                <ComparisonTable comparison={activeResult.comparison} />
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

      <AIChat currentInputs={formValues} />
    </FormProvider>
  );
}
