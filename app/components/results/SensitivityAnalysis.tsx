import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { formatCurrency, formatPercent } from "~/lib/utils";
import type { SensitivityRow } from "@fease-it/schemas";

interface SensitivityAnalysisProps {
  sensitivity: SensitivityRow[];
}

function getRowColor(value: number): string {
  if (value > 0) return "text-success";
  if (value === 0) return "text-gray-600";
  return "text-error";
}

export function SensitivityAnalysis({ sensitivity }: SensitivityAnalysisProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sensitivity Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Scenario</th>
                <th className="text-right py-2 font-medium">Profit</th>
                <th className="text-right py-2 font-medium">Margin</th>
                <th className="text-right py-2 font-medium">Cash Required</th>
                <th className="text-right py-2 font-medium">IRR</th>
              </tr>
            </thead>
            <tbody>
              {sensitivity.map((row, index) => (
                <tr key={index} className={`border-b ${index === 0 ? "bg-gray-50 font-semibold" : ""}`}>
                  <td className="py-2 font-medium">{row.label}</td>
                  <td className={`py-2 text-right font-mono ${getRowColor(row.profit)}`}>
                    {formatCurrency(row.profit)}
                  </td>
                  <td className={`py-2 text-right font-mono ${getRowColor(row.margin)}`}>
                    {formatPercent(row.margin)}
                  </td>
                  <td className="py-2 text-right font-mono">
                    {formatCurrency(row.cashRequired)}
                  </td>
                  <td className="py-2 text-right font-mono">
                    {row.irr !== undefined ? formatPercent(row.irr) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
