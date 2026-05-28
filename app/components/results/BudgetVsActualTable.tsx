import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { formatCurrency } from "~/lib/utils";
import type { BudgetVsActual } from "@fease-it/schemas";

interface BudgetVsActualTableProps {
  budgetVsActual: BudgetVsActual;
}

export function BudgetVsActualTable({ budgetVsActual }: BudgetVsActualTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget vs Actual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Category</th>
                <th className="text-right py-2 font-medium">Budget</th>
                <th className="text-right py-2 font-medium">Actual</th>
                <th className="text-right py-2 font-medium">Variance</th>
                <th className="text-right py-2 font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {budgetVsActual.items.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 text-gray-600">{item.category}</td>
                  <td className="py-2 text-right font-mono">{formatCurrency(item.budget)}</td>
                  <td className="py-2 text-right font-mono">{formatCurrency(item.actual)}</td>
                  <td className={`py-2 text-right font-mono ${item.variance >= 0 ? "text-success" : "text-error"}`}>
                    {formatCurrency(item.variance)}
                  </td>
                  <td className={`py-2 text-right font-mono text-xs ${item.variancePercent >= 0 ? "text-success" : "text-error"}`}>
                    {item.budget > 0 ? `${item.variancePercent.toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 font-semibold">
                <td className="py-2">Total</td>
                <td className="py-2 text-right font-mono">{formatCurrency(budgetVsActual.totalBudget)}</td>
                <td className="py-2 text-right font-mono">{formatCurrency(budgetVsActual.totalActual)}</td>
                <td className={`py-2 text-right font-mono ${budgetVsActual.totalVariance >= 0 ? "text-success" : "text-error"}`}>
                  {formatCurrency(budgetVsActual.totalVariance)}
                </td>
                <td className="py-2 text-right font-mono text-xs">
                  {budgetVsActual.totalBudget > 0
                    ? `${((budgetVsActual.totalVariance / budgetVsActual.totalBudget) * 100).toFixed(1)}%`
                    : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
