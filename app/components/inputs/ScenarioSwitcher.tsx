import { Toggle } from "~/components/ui/Toggle";
import { useFormContext, Controller } from "react-hook-form";
import type { FeasibilityInputs, ProjectScenario } from "~/types";

const SCENARIO_OPTIONS: { label: string; value: ProjectScenario }[] = [
  { label: "Build & Sell", value: "build-sell" },
  { label: "Sell 1 Hold 1", value: "sell-1-hold-1" },
  { label: "Rental Hold", value: "rental-hold" },
  { label: "Land + Build", value: "land-plus-build" },
  { label: "Build & Hold", value: "build-hold" },
  { label: "SDA Hold", value: "sda-hold" },
];

export function ScenarioSwitcher() {
  const { control } = useFormContext<FeasibilityInputs>();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <Controller
        name="scenario"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Toggle
            {...field}
            label="Project Scenario"
            options={SCENARIO_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            error={error?.message}
          />
        )}
      />
    </div>
  );
}
