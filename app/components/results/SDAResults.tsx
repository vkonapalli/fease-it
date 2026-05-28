import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { formatCurrency } from "~/lib/utils";
import { calculateSDA } from "~/lib/calculations/sda";
import type { SDAUnitConfig } from "@fease-it/schemas";

interface SDAResultsProps {
  sdaConfig: SDAUnitConfig;
}

export function SDAResults({ sdaConfig }: SDAResultsProps) {
  const result = calculateSDA({
    units: sdaConfig.units,
    sdaBasicMonthly: sdaConfig.sdaBasicMonthly,
    rrcMonthly: sdaConfig.rrcMonthly,
    ooaLeaseMonthly: sdaConfig.ooaLeaseMonthly,
    sdaScenario: sdaConfig.sdaScenario,
    landlordSharePercent: sdaConfig.landlordSharePercent,
    providerFeePercent: sdaConfig.providerFeePercent,
    landlordGuaranteedAnnual: sdaConfig.landlordGuaranteedAnnual,
    excessRevenueSplit: sdaConfig.excessRevenueSplit,
    maintenancePercent: 15,
    ratesAnnual: 12700,
    insuranceAnnual: 12000,
    propertyManagementPercent: 8,
    interestAnnual: 118000,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Annual Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{formatCurrency(result.totalAnnualRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Landlord Share</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono text-success">{formatCurrency(result.landlordShare)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Provider Share</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono text-primary">{formatCurrency(result.providerShare)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Net Cashflow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold font-mono ${result.netCashflow >= 0 ? "text-success" : "text-error"}`}>
              {formatCurrency(result.netCashflow)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SDA Revenue by Unit Count</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Units</th>
                  <th className="text-right py-2 font-medium">Full SDA</th>
                  <th className="text-right py-2 font-medium">No SDA</th>
                  <th className="text-right py-2 font-medium">Scenario Rev</th>
                  <th className="text-right py-2 font-medium">Guaranteed</th>
                  <th className="text-right py-2 font-medium">Excess</th>
                  <th className="text-right py-2 font-medium">Provider</th>
                  <th className="text-right py-2 font-medium">Landlord</th>
                </tr>
              </thead>
              <tbody>
                {result.perUnitBreakdown.map((row) => (
                  <tr
                    key={row.units}
                    className={`border-b hover:bg-gray-50 ${(row.units as number) === (sdaConfig.units as number) ? "bg-accent/5" : ""}`}
                  >
                    <td className="py-2 font-medium">{row.units}</td>
                    <td className="py-2 text-right font-mono">{formatCurrency(row.totalWithSDA)}</td>
                    <td className="py-2 text-right font-mono">{formatCurrency(row.totalWithoutSDA)}</td>
                    <td className="py-2 text-right font-mono font-semibold">{formatCurrency(row.scenarioRevenue)}</td>
                    <td className="py-2 text-right font-mono">{formatCurrency(row.landlordGuaranteed)}</td>
                    <td className="py-2 text-right font-mono">{formatCurrency(row.excessRevenue)}</td>
                    <td className="py-2 text-right font-mono text-primary">{formatCurrency(row.acaresShare)}</td>
                    <td className="py-2 text-right font-mono text-success">{formatCurrency(row.landlordFinal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
