import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FeasibilityInputs, Strategy } from "@fease-it/schemas";
import { createBaseInputs } from "~/lib/templates";
import { isEqual } from "~/lib/utils";

export interface Scenario {
  id: string;
  name: string;
  inputs: FeasibilityInputs;
  sortOrder: number;
  // synced indicates whether this scenario has been persisted to Supabase
  synced: boolean;
  // remoteId is the UUID from Supabase (null if only local)
  remoteId: string | null;
  // isPlaceholder indicates if this is the initial default scenario
  isPlaceholder?: boolean;
}

interface AppState {
  // Project
  projectId: string | null;
  projectName: string;
  setProject: (id: string | null, name: string) => void;

  // Scenarios
  scenarios: Scenario[];
  addScenario: (scenario: Scenario) => void;
  updateScenario: (id: string, updates: Partial<Omit<Scenario, "id">>) => void;
  removeScenario: (id: string) => void;
  markScenarioSynced: (localId: string, remoteId: string) => void;
  duplicateScenarioWithOptions: (
    id: string,
    name: string,
    options: {
      copyProperty: boolean;
      copyDevelopment: boolean;
      copyFinancing: boolean;
      copyRevenue: boolean;
      copyOperating: boolean;
      copyJV: boolean;
      copyCashflow: boolean;
      copyBudget: boolean;
    }
  ) => void;
  setScenarios: (scenarios: Scenario[]) => void;

  // Strategies
  customStrategies: Strategy[];
  preferredStrategyId: string | null;
  saveCustomStrategy: (strategy: Strategy) => void;
  deleteCustomStrategy: (id: string) => void;
  setPreferredStrategy: (id: string | null) => void;

  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  hydrateFromServer: (projectId: string, projectName: string, scenarios: Scenario[]) => void;
}

function createDefaultScenario(): Scenario {
  return {
    id: crypto.randomUUID(),
    name: "Scenario 1",
    inputs: createBaseInputs(),
    sortOrder: 0,
    synced: false,
    remoteId: null,
    isPlaceholder: true,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Project
      projectId: null,
      projectName: "",
      setProject: (id, name) => set({ projectId: id, projectName: name }),

      // Scenarios
      scenarios: [createDefaultScenario()],

      addScenario: (scenario) =>
        set((state) => ({
          scenarios: [...state.scenarios, { ...scenario, isPlaceholder: false }],
        })),

      updateScenario: (id, updates) =>
        set((state) => {
          const scenarioIndex = state.scenarios.findIndex(s => s.id === id);
          if (scenarioIndex === -1) return state;

          const currentScenario = state.scenarios[scenarioIndex];

          // Basic equality check for updates to avoid unnecessary renders
          let hasChanges = false;
          for (const key in updates) {
            if (key === "inputs") {
              if (!isEqual(updates.inputs, currentScenario.inputs)) {
                hasChanges = true;
                break;
              }
            } else if (updates[key as keyof typeof updates] !== currentScenario[key as keyof typeof currentScenario]) {
              hasChanges = true;
              break;
            }
          }
          if (!hasChanges) return state;

          return {
            scenarios: state.scenarios.map((s) =>
              s.id === id ? { ...s, ...updates, synced: false, isPlaceholder: false } : s
            ),
          };
        }),

      removeScenario: (id) =>
        set((state) => ({
          scenarios: state.scenarios.filter((s) => s.id !== id),
        })),

      markScenarioSynced: (localId, remoteId) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === localId ? { ...s, remoteId, synced: true } : s
          ),
        })),



      duplicateScenarioWithOptions: (id, name, options) =>
        set((state) => {
          const source = state.scenarios.find((s) => s.id === id);
          if (!source) return state;

          const defaults = createBaseInputs();
          const src = source.inputs;

          const newInputs: FeasibilityInputs = {
            name,
            scenario: src.scenario,
            property: options.copyProperty ? src.property : defaults.property,
            development: options.copyDevelopment
              ? src.development
              : { ...defaults.development, timeline: src.development.timeline },
            financing: options.copyFinancing ? src.financing : defaults.financing,
            revenue: options.copyRevenue ? src.revenue : defaults.revenue,
            operating: options.copyOperating ? src.operating : defaults.operating,
            jv: options.copyJV ? src.jv : defaults.jv,
            cashflow: options.copyCashflow ? src.cashflow : defaults.cashflow,
            budgetVsActual: options.copyBudget ? src.budgetVsActual : defaults.budgetVsActual,
            sda: src.sda,
            capitalStack: options.copyFinancing ? src.capitalStack : defaults.capitalStack,
            capitalSpread: options.copyCashflow ? src.capitalSpread : defaults.capitalSpread,
          };

          const copy: Scenario = {
            id: crypto.randomUUID(),
            name,
            inputs: newInputs,
            sortOrder: Math.max(...state.scenarios.map((s) => s.sortOrder), 0) + 1,
            synced: false,
            remoteId: null,
            isPlaceholder: false,
          };
          return {
            scenarios: [...state.scenarios, copy],
          };
        }),

      setScenarios: (scenarios) => set({ scenarios }),



      // Strategies
      customStrategies: [],
      preferredStrategyId: null,

      saveCustomStrategy: (strategy) =>
        set((state) => {
          const existing = state.customStrategies.find((p) => p.id === strategy.id);
          if (existing) {
            return {
              customStrategies: state.customStrategies.map((p) =>
                p.id === strategy.id ? strategy : p
              ),
            };
          }
          return { customStrategies: [...state.customStrategies, strategy] };
        }),

      deleteCustomStrategy: (id) =>
        set((state) => ({
          customStrategies: state.customStrategies.filter((p) => p.id !== id),
          preferredStrategyId:
            state.preferredStrategyId === id ? null : state.preferredStrategyId,
        })),

      setPreferredStrategy: (id) => set({ preferredStrategyId: id }),

      // Hydration
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      hydrateFromServer: (projectId, projectName, serverScenarios) => {
        set((state) => {
          const isSameProject = state.projectId === projectId;
          
          // Identify local scenarios that have unsynced changes, only if same project
          const unsyncedScenarios = isSameProject
            ? state.scenarios.filter((s) => s.remoteId && !s.synced)
            : [];
          
          // Start with server scenarios
          const mergedScenarios = [...serverScenarios];
          
          // For any server scenario that has a local unsynced version, use the local one
          for (let i = 0; i < mergedScenarios.length; i++) {
            const unsynced = unsyncedScenarios.find(u => u.remoteId === mergedScenarios[i].remoteId);
            if (unsynced) {
              mergedScenarios[i] = unsynced;
            }
          }

          // Deduplicate by ID to prevent React duplicate key errors
          const uniqueScenarios: Scenario[] = [];
          const seenIds = new Set<string>();
          for (const s of mergedScenarios) {
            if (!seenIds.has(s.id)) {
              seenIds.add(s.id);
              uniqueScenarios.push(s);
            }
          }

          // Sort by sortOrder
          uniqueScenarios.sort((a, b) => a.sortOrder - b.sortOrder);

          if (uniqueScenarios.length === 0) {
            uniqueScenarios.push(createDefaultScenario());
          }

          return {
            projectId,
            projectName,
            scenarios: uniqueScenarios,
            _hasHydrated: true,
          };
        });
      },
    }),
    {
      name: "fease-it-storage-v3",
      skipHydration: true,
      partialize: (state) => ({
        projectId: state.projectId,
        projectName: state.projectName,
        scenarios: state.scenarios,
        customStrategies: state.customStrategies,
        preferredStrategyId: state.preferredStrategyId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
