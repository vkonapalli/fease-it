import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { formatCurrency, formatPercent } from "~/lib/utils";
import type { YearlyProjection } from "@fease-it/schemas";

interface YearlyProjectionTableProps {
  projections: YearlyProjection[];
}

export function YearlyProjectionTable({ projections }: YearlyProjectionTableProps) {
  if (projections.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yearly Projections</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Year</th>
                <th className="text-right py-2 font-medium">Property Value</th>
                <th className="text-right py-2 font-medium">Rent</th>
                <th className="text-right py-2 font-medium">OpEx</th>
                <th className="text-right py-2 font-medium">Interest</th>
                <th className="text-right py-2 font-medium">Net CF</th>
                <th className="text-right py-2 font-medium">Cumulative</th>
                {projections.some((p) => p.salePrice) && (
                  <>
                    <th className="text-right py-2 font-medium">Sale Price</th>
                    <th className="text-right py-2 font-medium">Profit</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {projections.map((p) => (
                <tr key={p.year} className="border-b hover:bg-gray-50">
                  <td className="py-2 text-gray-600">Year {p.year}</td>
                  <td className="py-2 text-right font-mono">{formatCurrency(p.propertyValue)}</td>
                  <td className="py-2 text-right font-mono text-success">{formatCurrency(p.rentalIncome)}</td>
                  <td className="py-2 text-right font-mono text-error">{formatCurrency(p.operatingExpenses)}</td>
                  <td className="py-2 text-right font-mono text-error">{formatCurrency(p.interestPayment)}</td>
                  <td className={`py-2 text-right font-mono ${p.netCashflow >= 0 ? "text-success" : "text-error"}`}>
                    {formatCurrency(p.netCashflow)}
                  </td>
                  <td className={`py-2 text-right font-mono ${p.cumulativeCashflow >= 0 ? "text-success" : "text-error"}`}>
                    {formatCurrency(p.cumulativeCashflow)}
                  </td>
                  {projections.some((pr) => pr.salePrice) && (
                    <>
                      <td className="py-2 text-right font-mono">{p.salePrice ? formatCurrency(p.salePrice) : "—"}</td>
                      <td className={`py-2 text-right font-mono ${(p.profit ?? 0) >= 0 ? "text-success" : "text-error"}`}>
                        {p.profit ? formatCurrency(p.profit) : "—"}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
