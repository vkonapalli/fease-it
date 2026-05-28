import { debounce, isEqual } from "~/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import { useNavigate, useParams, useFetcher, useLoaderData, redirect, useSubmit, useNavigation, data as routerData } from "react-router";
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

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Project | Fease It" }
  ];
};

import { CapitalStackInputs } from "~/components/inputs/CapitalStackInputs";
import { CapitalSpreadInputs } from "~/components/inputs/CapitalSpreadInputs";
import { CopyScenarioDialog } from "~/components/inputs/CopyScenarioDialog";
import { ResultsPanel } from "~/components/results/ResultsPanel";
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
import { useForm, FormProvider, useWatch, useFormContext } from "react-hook-form";
import { useShallow } from "zustand/react/shallow";
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
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const projectId = params.projectId;
  if (!projectId) throw redirect("/projects");

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const { user, headers } = await requireAuth(request);
  if (!user) {
    throw redirect("/login", { headers });
  }

  // Verify project ownership and get scenarios
  const [project, scenarios] = await Promise.all([
    db.getProject(request, user.id, projectId),
    db.getScenarios(request, user.id, projectId)
  ]);

  if (!project) {
    throw redirect("/projects");
  }

  // Deduplicate scenarios from DB just in case of dirty data
  const uniqueScenarios = [];
  const seenIds = new Set();
  for (const s of scenarios) {
    if (!seenIds.has(s.id)) {
      seenIds.add(s.id);
      uniqueScenarios.push(s);
    }
  }

  return routerData({
    project: { id: project.id, name: project.name },
    scenarios: uniqueScenarios.map((s) => ({
      id: s.id,
      name: s.name,
      inputs: s.inputs,
      sortOrder: s.sort_order,
      synced: true,
      remoteId: s.id,
    })),
  }, { headers });
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
  const inputs = submission.data.inputs;


  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured" };
  }

  const { user, headers } = await requireAuth(request);
  if (!user) throw redirect("/login");

  try {
    if (intent === "delete-scenario" && id) {
      await db.deleteScenario(request, user.id, id, projectId);
      if (request.headers.get("X-Remix-Fetch") === "yes" || request.headers.get("Sec-Fetch-Mode") === "cors") {
        return routerData({ ok: true, id, intent: "delete-scenario" }, { headers });
      }
      const remaining = await db.getScenarios(request, user.id, projectId);
      if (remaining && remaining.length > 0) {
         return redirect(`/projects/${projectId}/scenarios/${remaining[0].id}`, { headers });
      }
      return redirect(`/projects/${projectId}`, { headers });
    }

    if (intent === "create-scenario" && name && inputs) {
      const localId = (rawData as Record<string, unknown>).localId as string | undefined;
      const scenario = await db.createScenario(
        request,
        user.id,
        projectId,
        name,
        inputs,
        submission.data.sortOrder ?? 0,
        localId
      );
      
      // If it was submitted via background fetcher (no navigation intended), return JSON
      if (request.headers.get("X-Remix-Fetch") === "yes" || request.headers.get("Sec-Fetch-Mode") === "cors") {
        return routerData({ ok: true, scenario, id: scenario.id, intent: "create-scenario" }, { headers });
      }
      return redirect(`/projects/${projectId}/scenarios/${scenario.id}`, { headers });
    }

    if (intent === "rename-scenario" && id && name) {
      await db.updateScenario(request, user.id, projectId, id, { name });
      return routerData({ ok: true, id, intent }, { headers });
    }

    if (intent === "update-scenario" && id && inputs) {
      await db.updateScenario(request, user.id, projectId, id, { inputs: inputs });
      return routerData({ ok: true, id, intent }, { headers });
    }

    if (intent === "duplicate-scenario" && name && inputs) {
      const scenario = await db.createScenario(
        request,
        user.id,
        projectId,
        name,
        inputs,
        submission.data.sortOrder ?? 0
      );
      return redirect(`/projects/${projectId}/scenarios/${scenario.id}`, { headers });
    }
  } catch (err: any) {
    return routerData({ error: err.message }, { headers });
  }

  return routerData({ error: "Unknown intent" }, { headers });
}

export default function ProjectDetail({ loaderData }: Route.ComponentProps) {
  const { projectId, "*": splat } = useParams();
  const { project, scenarios: initialScenarios } = loaderData;
  const navigate = useNavigate();
  const fetcher = useFetcher<ActionData>();
  const submit = useSubmit();

  const setProject = useAppStore((s) => s.setProject);
  const projectName = useAppStore((s) => s.projectName);
  const storeProjectId = useAppStore((s) => s.projectId);
  const scenarios = useAppStore(useShallow((s) => s.scenarios));
  const setScenarios = useAppStore((s) => s.setScenarios);
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
  // During transitions (like duplicating a scenario), the new scenario is in initialScenarios
  // but not yet hydrated into the store. We merge them here to prevent UI flicker.
  const displayScenarios = useMemo(() => {
    const raw = isStoreReady ? scenarios : initialScenarios;
    const filtered = raw;
    
    // Defensive deduplication
    const seen = new Set<string>();
    return filtered.filter((s) => {
      if (seen.has(s.id)) {
        console.warn("Duplicate scenario id detected:", s.id, s.name);
        return false;
      }
      seen.add(s.id);
      return true;
    });
  }, [isStoreReady, scenarios, initialScenarios]);

  const activeScenario = useMemo(() => {
    if (scenarioFromUrl) {
      const found = displayScenarios.find((s) => s.id === scenarioFromUrl);
      if (found) return found;
    }
    return displayScenarios[0] ?? null;
  }, [displayScenarios, scenarioFromUrl]);

  const methods = useForm<FeasibilityInputs>({
    defaultValues: activeScenario?.inputs,
    resolver: zodResolver(FeasibilityInputsSchema) as any,
    mode: "onChange",
  });

  const { reset } = methods;

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
    if (displayScenarios.length === 0) return;
    
    // If the ID in the URL is not found or missing, redirect to the first scenario
    if (!scenarioFromUrl || !displayScenarios.some(s => s.id === scenarioFromUrl)) {
      if (!initialised.current || isStoreReady) {
        handleNavigateScenario(displayScenarios[0].id);
        initialised.current = true;
      }
    } else {
      initialised.current = true;
    }
  }, [displayScenarios, scenarioFromUrl, handleNavigateScenario, isStoreReady]);

  // Debounced server sync
  const debouncedSave = useCallback(
    debounce((id: string, remoteId: string | null, name: string, currentInputs: FeasibilityInputs, sortOrder?: number) => {
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
            ...(sortOrder !== undefined ? { sortOrder } : {}),
          } as any,
          { method: "post", encType: "application/json" }
        );
      }
    }, 2000),
    [fetcher]
  );

  // Auto-save via RHF subscription (trackhub-web pattern).
  // We use form.watch(callback) instead of watch() in render + useEffect.
  // This avoids a circular dependency: watch() -> render -> useEffect ->
  // updateScenarioLocal -> new scenarios array -> activeScenario ref change ->
  // reset effect -> reset() -> watch() trigger -> render -> useEffect again.
  useEffect(() => {
    const subscription = methods.watch((data) => {
      const activeId = activeScenario?.id;
      if (!activeId) return;

      const state = useAppStore.getState();
      const currentScenario = state.scenarios.find(
        (s) => s.id === activeId
      );
      if (!currentScenario) return;

      // Track that this change came from the form itself.
      lastFormValuesRef.current = data as FeasibilityInputs;

      if (!isEqual(data, currentScenario.inputs)) {
        updateScenarioLocal(activeId, {
          inputs: data as FeasibilityInputs,
        });
        debouncedSave(
          activeId,
          currentScenario.remoteId,
          currentScenario.name,
          data as FeasibilityInputs,
          currentScenario.sortOrder
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [methods, activeScenario, updateScenarioLocal, debouncedSave]);

  // Handle successful background auto-save responses
  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    const resp = fetcher.data;
    if ("ok" in resp && resp.ok) {
      const intent = resp.intent;
      const id = resp.id;
      if (intent === "create-scenario" && id) {
        markScenarioSynced(id, id);
      } else if (intent === "update-scenario" && id && activeScenario?.id) {
        markScenarioSynced(activeScenario.id, id);
      }
    }
  }, [fetcher.state, fetcher.data, markScenarioSynced, activeScenario?.id]);

  const scenarioType = useWatch({ control: methods.control, name: "scenario" });
  const isSDA = scenarioType === "sda-hold";

  const formValues = useWatch({ control: methods.control }) as FeasibilityInputs;
  const deferredFormValues = useDeferredValue(formValues);
  const results = useMemo(() => {
    if (!deferredFormValues || Object.keys(deferredFormValues).length === 0) return null;
    return calculateFeasibility(deferredFormValues);
  }, [deferredFormValues]);
  const activeResult = results?.scenarios.find((s) => s.scenario === results.activeScenario);

  // Deriving saving state from React Router
  const { state: navigationState, formData: navigationFormData } = useNavigation();
  const isGlobalSaving = navigationState !== "idle" && ["create-scenario", "duplicate-scenario", "delete-scenario"].includes(navigationFormData?.get("intent") as string);
  const isAutoSaving = fetcher.state !== "idle" && fetcher.formData?.get("intent") === "update-scenario";
  const saving = isGlobalSaving || isAutoSaving;

  function handleAddScenario() {
    if (!projectId) return;
    if (displayScenarios.length >= 20) {
      alert("Maximum 20 scenarios allowed.");
      return;
    }
    const source = activeScenario ?? displayScenarios[0];
    const newName = `Scenario ${displayScenarios.length + 1}`;
    const newInputs = source
      ? structuredClone({ ...source.inputs, name: newName }) as AppScenario["inputs"]
      : ({} as AppScenario["inputs"]);
    
    submit(
      {
        intent: "create-scenario",
        name: newName,
        inputs: newInputs,
        sortOrder: Math.max(...displayScenarios.map((s) => s.sortOrder), 0) + 1,
      } as any,
      { method: "post", encType: "application/json" }
    );
  }

  async function handleDeleteScenario(id: string) {
    if (displayScenarios.length <= 1) {
      alert("You must keep at least one scenario.");
      return;
    }
    const scenario = displayScenarios.find((s) => s.id === id);
    if (!scenario) return;

    // Determine the fallback if we are deleting the currently active scenario
    const isActive = activeScenario?.id === id;
    const remaining = displayScenarios.filter(s => s.id !== id);
    const fallbackId = remaining[0]?.id;

    if (!scenario?.remoteId) {
        removeScenario(id);
        if (isActive && fallbackId) {
            handleNavigateScenario(fallbackId);
        }
        return;
    }
    
    // Server deletion via fetcher avoids forcing a full page reload or loss of active tab
    fetcher.submit(
      {
        intent: "delete-scenario",
        id: scenario.remoteId,
      } as any,
      { method: "post", encType: "application/json" }
    );
    // Optimistically remove it locally
    removeScenario(id);
    if (isActive && fallbackId) {
        handleNavigateScenario(fallbackId);
    }
  }

  function handleRenameScenario(id: string, name: string) {
    updateScenarioLocal(id, { name });
  }

  function handleScenarioSelect(id: string) {
    if (id === activeScenario?.id) return;
    handleNavigateScenario(id);
  }

  function handleCopyScenario(
    id: string,
    name: string,
    options: Parameters<typeof duplicateScenarioWithOptions>[2]
  ) {
    const source = displayScenarios.find(s => s.id === id);
    if (!source) return;
    
    setCopyDialogId(null);
    
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
        sortOrder: Math.max(...scenarios.map((s) => s.sortOrder), 0) + 1,
      } as any,
      { method: "post", encType: "application/json" }
    );
  }

  const isDeleting = (navigationState !== "idle" && navigationFormData?.get("intent") === "delete-scenario") || 
                     (fetcher.state !== "idle" && fetcher.formData?.get("intent") === "delete-scenario");
  const deletingId = isDeleting ? ((navigationFormData?.get("id") || fetcher.formData?.get("id")) as string) : null;
  
  // displayScenarios is now updated directly from baseScenarios filtering
  const visibleScenarios = useMemo(() => {
    return deletingId 
      ? displayScenarios.filter((s) => s.id !== deletingId && s.remoteId !== deletingId) 
      : displayScenarios;
  }, [displayScenarios, deletingId]);

  const copySource = copyDialogId ? visibleScenarios.find((s) => s.id === copyDialogId) ?? null : null;

  return (
    <FormProvider {...methods}>
      {/* Scenario Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {visibleScenarios.map((s) => (
            <button
              type="button"
              key={s.id}
              className={`group flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap transition-colors ${
                s.id === activeScenario?.id
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
                <input aria-label="Input field"
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
              {visibleScenarios.length > 1 && (
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
            disabled={visibleScenarios.length >= 20}
            className="whitespace-nowrap"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
          {saving && <span className="text-xs text-gray-500 ml-auto">Saving...</span>}
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
                <CapitalStackInputs totalProjectCost={activeResult?.totalProjectCost} />
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
            <ResultsPanel results={results} />
          </div>
        </div>
      </main>

      <AIChatWrapper activeScenarioId={activeScenario?.id ?? null} />
    </FormProvider>
  );
}

// AIChat wrapper below
function AIChatWrapper({ activeScenarioId }: { activeScenarioId: string | null }) {
  const formValues = useWatch();
  const { setValue } = useFormContext();

  const handleUpdateInputs = useCallback((changes: Record<string, unknown>) => {
    if (!formValues) return;
    const merged = structuredClone(formValues) as Record<string, unknown>;
    for (const [path, value] of Object.entries(changes)) {
      // Inline setDeep logic or we can import it. Wait, the component is at the bottom of the file.
      // Let's just iterate over the changes and use `setValue` since RHF supports dot notation paths!
      setValue(path, value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
  }, [formValues, setValue]);

  return (
    <AIChat 
      currentInputs={formValues as FeasibilityInputs} 
      activeScenarioId={activeScenarioId}
      onUpdateInputs={handleUpdateInputs} 
    />
  );
}
