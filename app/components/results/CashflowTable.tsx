import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { formatCurrency } from "~/lib/utils";
import type { CashflowRow } from "~/types";

interface CashflowTableProps {
  cashflow: CashflowRow[];
}

export function CashflowTable({ cashflow }: CashflowTableProps) {
  if (cashflow.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cashflow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Period</th>
                <th className="text-right py-2 font-medium">Income</th>
                <th className="text-right py-2 font-medium">Expenses</th>
                <th className="text-right py-2 font-medium">Net</th>
                <th className="text-right py-2 font-medium">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {cashflow.map((row) => (
                <tr key={row.period} className="border-b hover:bg-gray-50">
                  <td className="py-2 text-gray-600">{row.periodLabel}</td>
                  <td className="py-2 text-right font-mono text-success">{formatCurrency(row.income)}</td>
                  <td className="py-2 text-right font-mono text-error">{formatCurrency(row.expenses)}</td>
                  <td className={`py-2 text-right font-mono ${row.netCashflow >= 0 ? "text-success" : "text-error"}`}>
                    {formatCurrency(row.netCashflow)}
                  </td>
                  <td className={`py-2 text-right font-mono ${row.cumulativeCashflow >= 0 ? "text-success" : "text-error"}`}>
                    {formatCurrency(row.cumulativeCashflow)}
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
