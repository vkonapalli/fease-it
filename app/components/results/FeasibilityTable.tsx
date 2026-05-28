import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { formatCurrency, formatPercent } from "~/lib/utils";
import type { ScenarioResult } from "@fease-it/schemas";

interface FeasibilityTableProps {
  result: ScenarioResult;
}

export function FeasibilityTable({ result }: FeasibilityTableProps) {
  const { costBreakdown, totalRevenue, profit, profitMargin, profitOnCost } = result;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feasibility Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <Row label="Gross Revenue" value={totalRevenue} isHeader />
              <Row label="Acquisition Costs" value={costBreakdown.acquisition} isSubtotal />
              <Row label="  • Purchase Price & Stamp Duty" value={costBreakdown.acquisition} isIndent />
              <Row label="Construction Costs" value={costBreakdown.construction} isSubtotal />
              <Row label="Development & Global Costs" value={costBreakdown.development} isSubtotal />
              <Row label="Financing Costs" value={costBreakdown.financing} isSubtotal />
              <Row label="Marketing Costs" value={costBreakdown.marketing} isSubtotal />
              <Row label="Holding Costs" value={costBreakdown.holding} isSubtotal />
              <Row label="Land Tax" value={costBreakdown.landTax} isSubtotal />
              <Row label="Sales Commission" value={costBreakdown.salesCommission} isSubtotal />
              <Row label="Contingency" value={costBreakdown.contingency} isSubtotal />
              
              <tr className="border-t-2 border-gray-200">
                <td className="py-2 font-bold text-gray-900 text-base">Total Costs</td>
                <td className="py-2 text-right font-mono font-bold text-base">
                  {formatCurrency(costBreakdown.total)}
                </td>
              </tr>

              <tr className="bg-accent/5">
                <td className="py-3 font-bold text-primary text-lg">Net Profit</td>
                <td className="py-3 text-right font-mono font-bold text-primary text-lg">
                  {formatCurrency(profit)}
                </td>
              </tr>

              <tr className="border-t border-gray-100">
                <td className="py-2 text-gray-600">Profit Margin (on Revenue)</td>
                <td className="py-2 text-right font-mono font-semibold">
                  {formatPercent(profitMargin)}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-600">Profit on Cost</td>
                <td className="py-2 text-right font-mono font-semibold">
                  {formatPercent(profitOnCost)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ 
  label, 
  value, 
  isHeader, 
  isSubtotal, 
  isIndent 
}: { 
  label: string; 
  value: number; 
  isHeader?: boolean; 
  isSubtotal?: boolean;
  isIndent?: boolean;
}) {
  return (
    <tr className={`${isHeader ? "bg-gray-50" : ""} ${isSubtotal ? "border-t border-gray-100" : ""}`}>
      <td className={`py-2 ${isHeader ? "font-bold text-gray-900" : isIndent ? "pl-4 text-gray-500" : "text-gray-700"}`}>
        {label}
      </td>
      <td className={`py-2 text-right font-mono ${isHeader ? "font-bold" : ""}`}>
        {formatCurrency(value)}
      </td>
    </tr>
  );
}
