import { useMemo, useDeferredValue } from "react";
import { useWatch } from "react-hook-form";
import type { FeasibilityInputs } from "~/types";
import { calculateFeasibility } from "~/lib/calculations";
import { useAppStore } from "~/stores/appStore";
import { useShallow } from "zustand/react/shallow";

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

export function ResultsPanel() {
  const formValues = useWatch() as FeasibilityInputs;
  const deferredFormValues = useDeferredValue(formValues);
  
  // We need scenarios length to decide whether to show ScenarioComparison
  const scenariosLength = useAppStore(useShallow(s => s.scenarios.length));

  const results = useMemo(() => {
    if (!deferredFormValues || Object.keys(deferredFormValues).length === 0) return null;
    return calculateFeasibility(deferredFormValues);
  }, [deferredFormValues]);

  const isSDA = deferredFormValues?.scenario === "sda-hold";
  const activeResult = results?.scenarios.find((s) => s.scenario === results.activeScenario);

  return (
    <div className="space-y-4">
      {isSDA ? (
        <SDAResults sdaConfig={deferredFormValues?.sda} />
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
          
          {scenariosLength > 1 && <ScenarioComparison />}
          
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
  );
}
