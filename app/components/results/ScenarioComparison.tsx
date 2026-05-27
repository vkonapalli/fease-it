import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { useAppStore } from "~/stores/appStore";
import { useShallow } from "zustand/react/shallow";
import { calculateFeasibility } from "~/lib/calculations";
import { formatCurrency } from "~/lib/calculations/stampDuty";
import { ArrowRightLeft, X } from "lucide-react";

export function ScenarioComparison() {
  const scenarios = useAppStore(useShallow((s) => s.scenarios));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const compared = selectedIds
    .map((id) => {
      const scenario = scenarios.find((s) => s.id === id);
      if (!scenario) return null;
      const results = calculateFeasibility(scenario.inputs);
      const active = results.scenarios.find((s) => s.scenario === results.activeScenario);
      if (!active) return null;
      return {
        id: scenario.id,
        name: scenario.name,
        profit: active.profit,
        profitMargin: active.profitMargin,
        profitOnCost: active.profitOnCost,
        cashRequired: active.cashRequired,
        totalRevenue: active.totalRevenue,
        totalCosts: active.totalCosts,
        loanAmount: active.loanAmount,
        equityRequired: active.equityRequired,
        irr: active.irr,
      };
    })
    .filter(Boolean);

  if (scenarios.length < 2) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Compare Scenarios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Select 2–4 scenarios to compare:</p>
          <div className="flex flex-wrap gap-2">
            {scenarios.map((s) => {
              const selected = selectedIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSelection(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selected
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {s.name}
                  {selected && <X className="h-3 w-3 inline ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {compared.length >= 2 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-gray-500">Metric</th>
                  {compared.map((c) => (
                    <th key={c!.id} className="text-right py-2 font-medium">
                      {c!.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow label="Profit" values={compared.map((c) => c!.profit)} formatter={formatCurrency} higherIsBetter />
                <CompareRow label="Profit Margin" values={compared.map((c) => c!.profitMargin)} formatter={(v) => `${v.toFixed(1)}%`} higherIsBetter />
                <CompareRow label="Profit on Cost" values={compared.map((c) => c!.profitOnCost)} formatter={(v) => `${v.toFixed(1)}%`} higherIsBetter />
                <CompareRow label="Total Revenue" values={compared.map((c) => c!.totalRevenue)} formatter={formatCurrency} />
                <CompareRow label="Total Costs" values={compared.map((c) => c!.totalCosts)} formatter={formatCurrency} />
                <CompareRow label="Cash Required" values={compared.map((c) => c!.cashRequired)} formatter={formatCurrency} lowerIsBetter />
                <CompareRow label="Loan Amount" values={compared.map((c) => c!.loanAmount)} formatter={formatCurrency} />
                <CompareRow label="Equity Required" values={compared.map((c) => c!.equityRequired)} formatter={formatCurrency} />
                <CompareRow label="IRR" values={compared.map((c) => c!.irr)} formatter={(v) => `${v.toFixed(1)}%`} higherIsBetter />
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CompareRow({
  label,
  values,
  formatter,
  higherIsBetter,
  lowerIsBetter,
}: {
  label: string;
  values: number[];
  formatter: (v: number) => string;
  higherIsBetter?: boolean;
  lowerIsBetter?: boolean;
}) {
  const bestIndex = higherIsBetter
    ? values.indexOf(Math.max(...values))
    : lowerIsBetter
    ? values.indexOf(Math.min(...values))
    : -1;

  return (
    <tr className="border-b border-gray-100">
      <td className="py-2 text-gray-600">{label}</td>
      {values.map((v, i) => (
        <td
          key={i}
          className={`py-2 text-right font-mono ${
            i === bestIndex
              ? higherIsBetter
                ? "text-success font-semibold"
                : lowerIsBetter
                ? "text-success font-semibold"
                : ""
              : ""
          }`}
        >
          {formatter(v)}
        </td>
      ))}
    </tr>
  );
}
