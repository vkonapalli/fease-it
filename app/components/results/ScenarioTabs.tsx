import { useFormContext } from "react-hook-form";
import type { ProjectScenario, ScenarioResult } from "~/types";
import { formatCurrency } from "~/lib/utils";

interface ScenarioTabsProps {
  scenarios: ScenarioResult[];
  activeScenario: ProjectScenario;
}

export function ScenarioTabs({ scenarios, activeScenario }: ScenarioTabsProps) {
  const { setValue } = useFormContext();

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex overflow-x-auto">
        {scenarios.map((s) => (
          <button
            key={s.scenario}
            onClick={() => setValue("scenario", s.scenario, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeScenario === s.scenario
                ? "border-accent text-primary bg-accent/5"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="text-left">
              <div>{s.scenarioName}</div>
              <div className={`text-xs font-mono ${s.profit >= 0 ? "text-success" : "text-error"}`}>
                {formatCurrency(s.profit)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
