import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "./appStore";
import type { FeasibilityInputs } from "~/types";

/**
 * Granular hook that subscribes to a single top-level input slice.
 * Prevents re-renders when unrelated slices change.
 *
 * Usage:
 *   const [property, setProperty] = useInputSlice("property");
 *   setProperty({ purchasePrice: 1_200_000 });
 */
export function useInputSlice<K extends keyof FeasibilityInputs>(
  key: K
): [FeasibilityInputs[K], (updates: Partial<FeasibilityInputs[K]>) => void] {
  const value = useAppStore(useShallow((s) => s.getActiveScenario()?.inputs[key]));
  const updateActiveInputs = useAppStore((s) => s.updateActiveInputs);

  const setValue = (updates: Partial<FeasibilityInputs[K]>) => {
    const current = value as unknown as Record<string, unknown>;
    updateActiveInputs(
      { [key]: { ...current, ...updates } } as unknown as Partial<FeasibilityInputs>
    );
  };

  return [value!, setValue];
}

/**
 * Granular hook for the active scenario strategy type.
 * Only re-renders when the scenario strategy changes.
 */
export function useScenarioInput(): [
  FeasibilityInputs["scenario"],
  (scenario: FeasibilityInputs["scenario"]) => void
] {
  const scenario = useAppStore((s) => s.getActiveScenario()?.inputs.scenario);
  const updateActiveInputs = useAppStore((s) => s.updateActiveInputs);

  const setScenario = (value: FeasibilityInputs["scenario"]) => {
    updateActiveInputs({ scenario: value });
  };

  return [scenario!, setScenario];
}

/**
 * Legacy compatibility shim.
 *
 * Prefer `useInputSlice("property")` or `useAppStore(useShallow(...))`
 * in new code. This shim is kept for any remaining consumers that
 * haven't been migrated yet.
 */
export function useFeasibilityStore(): {
  inputs: FeasibilityInputs;
  setInputs: (inputs: Partial<FeasibilityInputs>) => void;
  setResults: (results: never) => void;
  resetInputs: () => void;
} {
  const scenario = useAppStore(useShallow((s) => s.getActiveScenario()));
  const updateActiveInputs = useAppStore((s) => s.updateActiveInputs);

  const inputs = scenario?.inputs ?? ({} as FeasibilityInputs);

  return {
    inputs,
    setInputs: updateActiveInputs,
    setResults: () => {},
    resetInputs: () => {
      const defaults = useAppStore.getState().scenarios[0]?.inputs;
      if (defaults) {
        updateActiveInputs(defaults);
      }
    },
  };
}
