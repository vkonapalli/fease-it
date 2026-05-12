import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { formatCurrency } from "~/lib/utils";

interface DeficitCardProps {
  deficit: number;
  totalProjectCost: number;
  seniorDebtAmount: number;
  mezzanineDebtAmount: number;
  privateLendingAmount: number;
  committedCapital: number;
}

export function DeficitCard({
  deficit,
  totalProjectCost,
  seniorDebtAmount,
  mezzanineDebtAmount,
  privateLendingAmount,
  committedCapital,
}: DeficitCardProps) {
  const isFullyFunded = deficit <= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Funding Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Project Cost</span>
            <span className="text-sm font-mono font-semibold">{formatCurrency(totalProjectCost)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Senior Debt</span>
            <span className="text-sm font-mono">{formatCurrency(seniorDebtAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Mezzanine Debt</span>
            <span className="text-sm font-mono">{formatCurrency(mezzanineDebtAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Private Lending</span>
            <span className="text-sm font-mono">{formatCurrency(privateLendingAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Committed Equity</span>
            <span className="text-sm font-mono">{formatCurrency(committedCapital)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
            <span className="text-sm font-medium">
              {isFullyFunded ? "Fully Funded" : "Funding Gap"}
            </span>
            <span
              className={`text-lg font-bold font-mono ${
                isFullyFunded ? "text-success" : "text-error"
              }`}
              title="Deficit = Total Cost − Total Committed Capital"
            >
              {formatCurrency(Math.abs(deficit))}
            </span>
          </div>
          {!isFullyFunded && (
            <p className="text-xs text-error">
              Deficit = Total Cost − Total Committed Capital
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
