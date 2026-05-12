import { Toggle } from "~/components/ui/Toggle";
import { useFeasibilityStore } from "~/stores/feasibilityStore";
import type { ProjectScenario } from "~/types";

const SCENARIO_OPTIONS: { label: string; value: ProjectScenario }[] = [
  { label: "Sell All", value: "sell-all" },
  { label: "Sell 1 Hold 1", value: "sell-1-hold-1" },
  { label: "Rental Hold", value: "rental-hold" },
  { label: "Land + Build", value: "land-plus-build" },
  { label: "Build & Hold", value: "build-hold" },
  { label: "SDA Hold", value: "sda-hold" },
];

export function ScenarioSwitcher() {
  const { inputs, setInputs } = useFeasibilityStore();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <Toggle
        label="Project Scenario"
        options={SCENARIO_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
        value={inputs.scenario}
        onChange={(value) => setInputs({ scenario: value as ProjectScenario })}
      />
    </div>
  );
}
