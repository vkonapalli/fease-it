import { useAppStore } from "./appStore";
import type { FeasibilityInputs } from "~/types";

/**
 * Compatibility shim for existing components that expect the old
 * useFeasibilityStore interface (single inputs + setInputs).
 *
 * This hook reads/writes the active scenario from the new appStore.
 * It will be removed once all components are migrated to useAppStore
 * with granular selectors.
 */
export function useFeasibilityStore(): {
  inputs: FeasibilityInputs;
  setInputs: (inputs: Partial<FeasibilityInputs>) => void;
  setResults: (results: never) => void; // no-op; results are derived
  resetInputs: () => void;
} {
  const scenario = useAppStore((s) => s.getActiveScenario());
  const updateActiveInputs = useAppStore((s) => s.updateActiveInputs);

  const inputs = scenario?.inputs ?? {} as FeasibilityInputs;

  return {
    inputs,
    setInputs: updateActiveInputs,
    setResults: () => {}, // no-op; results are derived, not stored
    resetInputs: () => {
      // Reset to defaults for the active scenario
      const defaults = useAppStore.getState().scenarios[0]?.inputs;
      if (defaults) {
        updateActiveInputs(defaults);
      }
    },
  };
}
