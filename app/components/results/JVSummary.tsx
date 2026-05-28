import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { formatCurrency, formatPercent } from "~/lib/utils";
import type { JVResult } from "@fease-it/schemas";

interface JVSummaryProps {
  jv: JVResult;
}

export function JVSummary({ jv }: JVSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Capital Stack & JV Returns</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Total Capital Raised</p>
            <p className="text-lg font-bold font-mono">{formatCurrency(jv.totalCapitalRaised)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Developer Equity</p>
            <p className="text-lg font-bold font-mono">{formatCurrency(jv.developerEquity)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Investment</p>
            <p className="text-lg font-bold font-mono">{formatCurrency(jv.totalInvestment)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs text-gray-500">Investor Profit Share</p>
            <p className="text-lg font-bold font-mono text-success">{formatCurrency(jv.investorProfitShare)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Developer Profit Share</p>
            <p className="text-lg font-bold font-mono text-primary">{formatCurrency(jv.developerProfitShare)}</p>
          </div>
        </div>

        {jv.moneyPartnerInterest > 0 && (
          <div className="text-center border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500">Money Partner Interest</p>
            <p className="text-lg font-bold font-mono text-warning">{formatCurrency(jv.moneyPartnerInterest)}</p>
          </div>
        )}

        {jv.roundReturns.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-700 mb-2">Round Returns</p>
            <div className="space-y-2">
              {jv.roundReturns.map((r) => (
                <div key={r.roundId} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{r.roundName}</span>
                  <div className="flex gap-4 font-mono">
                    <span className="text-success">{formatCurrency(r.investorReturn)}</span>
                    <span className="text-gray-500">({formatPercent(r.investorReturnPercent)})</span>
                    <span className="text-gray-500 text-xs">IRR {formatPercent(r.irr * 100)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
