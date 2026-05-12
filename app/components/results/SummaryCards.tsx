import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { formatCurrency, formatPercent } from "~/lib/utils";
import type { ScenarioResult } from "~/types";

interface SummaryCardsProps {
  results: ScenarioResult;
}

function getMarginColor(margin: number): string {
  if (margin >= 20) return "text-success";
  if (margin >= 15) return "text-warning";
  return "text-error";
}

export function SummaryCards({ results }: SummaryCardsProps) {
  const marginColor = getMarginColor(results.profitMargin);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">{results.scenarioName}</h2>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {results.scenario}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cash Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{formatCurrency(results.cashRequired)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Loan Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{formatCurrency(results.loanAmount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{formatCurrency(results.totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{formatCurrency(results.totalCosts)}</p>
          </CardContent>
        </Card>

        {results.marginSchemeGst > 0 && (
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Margin Scheme GST</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold font-mono text-primary">{formatCurrency(results.marginSchemeGst)}</p>
            </CardContent>
          </Card>
        )}

        {results.salesCommission > 0 && (
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Sales Commission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold font-mono">{formatCurrency(results.salesCommission)}</p>
            </CardContent>
          </Card>
        )}

        <Card variant="highlighted" className="col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold font-mono ${marginColor}`}>
              {formatCurrency(results.profit)}
            </p>
            <p className={`text-sm font-medium ${marginColor}`}>
              {formatPercent(results.profitMargin)} margin on cost
            </p>
            {results.profitOnCost !== results.profitMargin && (
              <p className="text-xs text-gray-500 mt-1">
                Profit on cost: {formatPercent(results.profitOnCost)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {results.cgtEstimate > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Estimated Tax Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold font-mono">{formatCurrency(results.cgtEstimate)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Consult your accountant. Development profits may be treated as ordinary income.
            </p>
          </CardContent>
        </Card>
      )}

      {results.annualRentalIncome > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Annual Rent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold font-mono">{formatCurrency(results.annualRentalIncome)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Net Operating Income</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold font-mono">{formatCurrency(results.netOperatingIncome)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cap Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold font-mono">{formatPercent(results.capRate)}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
