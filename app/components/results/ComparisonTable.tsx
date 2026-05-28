import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { formatCurrency, formatPercent } from "~/lib/utils";
import type { ComparisonRow } from "@fease-it/schemas";

interface ComparisonTableProps {
  comparison: ComparisonRow[];
}

export function ComparisonTable({ comparison }: ComparisonTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>LVR Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Metric</th>
                {comparison.map((row) => (
                  <th key={row.lvr} className="text-right py-2 font-medium">
                    {row.lvr}% LVR
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 text-gray-600">Loan Amount</td>
                {comparison.map((row) => (
                  <td key={row.lvr} className="py-2 text-right font-mono">
                    {formatCurrency(row.loan)}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-600">Cash Required</td>
                {comparison.map((row) => (
                  <td key={row.lvr} className="py-2 text-right font-mono">
                    {formatCurrency(row.cashRequired)}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-600">Monthly Interest</td>
                {comparison.map((row) => (
                  <td key={row.lvr} className="py-2 text-right font-mono">
                    {formatCurrency(row.monthlyPayment)}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-600">Total Interest</td>
                {comparison.map((row) => (
                  <td key={row.lvr} className="py-2 text-right font-mono">
                    {formatCurrency(row.totalInterest)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 text-gray-600">Profit After Interest</td>
                {comparison.map((row) => (
                  <td key={row.lvr} className="py-2 text-right font-mono font-semibold">
                    {formatCurrency(row.profitAfterInterest)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 text-gray-600">Profit Margin</td>
                {comparison.map((row) => (
                  <td key={row.lvr} className="py-2 text-right font-mono font-semibold">
                    {formatPercent(row.profitMargin)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
