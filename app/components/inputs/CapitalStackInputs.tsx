import { useMemo } from "react";
import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Toggle } from "~/components/ui/Toggle";
import { ComputedDollarDisplay } from "~/components/ui/ComputedDollar";
import { Button } from "~/components/ui/Button";
import { useAppStore } from "~/stores/appStore";
import { useShallow } from "zustand/react/shallow";
import { RefreshCw } from "lucide-react";

export function CapitalStackInputs() {
  const capitalStack = useAppStore(useShallow((s) => s.getActiveScenario()!.inputs.capitalStack));
  const financing = useAppStore(useShallow((s) => s.getActiveScenario()!.inputs.financing));
  const property = useAppStore(useShallow((s) => s.getActiveScenario()!.inputs.property));
  const capitalSpread = useAppStore(useShallow((s) => s.getActiveScenario()!.inputs.capitalSpread));
  const updateActiveInputs = useAppStore((s) => s.updateActiveInputs);

  const totalProjectCost = useMemo(() => {
    return property.purchasePrice;
  }, [property.purchasePrice]);

  const seniorDebtAmount = useMemo(() => {
    return property.purchasePrice * (financing.lvr / 100);
  }, [property.purchasePrice, financing.lvr]);

  const mezzanineDebtAmount = useMemo(() => {
    if (!financing.secondLvr || financing.secondLvr <= 0) return 0;
    return property.purchasePrice * (financing.secondLvr / 100);
  }, [property.purchasePrice, financing.secondLvr]);

  // Compute linked spread totals by stack category
  const spreadTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const item of capitalSpread) {
      if (!item.linkedStackCategory) continue;
      const amount = item.isPercentage
        ? totalProjectCost * (item.amount / 100)
        : item.amount;
      totals[item.linkedStackCategory] = (totals[item.linkedStackCategory] ?? 0) + amount;
    }
    return totals;
  }, [capitalSpread, totalProjectCost]);

  const updateStack = (updates: Partial<typeof capitalStack>) => {
    updateActiveInputs({ capitalStack: { ...capitalStack!, ...updates } });
  };

  function syncFromSpread() {
    const next = { ...capitalStack! };

    const privateLendingTotal = spreadTotals["Private Lending"];
    if (privateLendingTotal && privateLendingTotal > 0 && !next.privateLending.isPercentageOfCost) {
      next.privateLending = { ...next.privateLending, amount: privateLendingTotal };
    }

    const profitSharingTotal = spreadTotals["Profit Sharing"];
    if (profitSharingTotal && profitSharingTotal > 0) {
      next.profitSharing = { ...next.profitSharing, amountCommitted: profitSharingTotal };
    }

    const devEquityTotal = spreadTotals["Developer Equity"];
    if (devEquityTotal && devEquityTotal > 0) {
      next.developerEquity = { ...next.developerEquity, isAutoComputed: false, amount: devEquityTotal };
    }

    const otherEquityTotal = spreadTotals["Other Equity"];
    if (otherEquityTotal && otherEquityTotal > 0 && !next.otherEquity.isPercentageOfCost) {
      next.otherEquity = { ...next.otherEquity, amount: otherEquityTotal };
    }

    updateActiveInputs({ capitalStack: next });
  }

  const hasLinkedItems = Object.keys(spreadTotals).length > 0;

  return (
    <Collapsible title="Capital Stack">
      <div className="space-y-4">
        {hasLinkedItems && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <div>
              <p className="text-sm font-medium text-blue-900">Linked to Capital Spread</p>
              <p className="text-xs text-blue-700">
                {Object.entries(spreadTotals)
                  .map(([cat, amt]) => `${cat}: ${formatCurrency(amt)}`)
                  .join(" · ")}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={syncFromSpread}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Sync
            </Button>
          </div>
        )}

        {/* Senior Debt (read-only from FinancingInputs) */}
        <div className="rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold text-gray-800">1. Senior Debt</h4>
            {spreadTotals["Senior Debt"] > 0 && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Spread: {formatCurrency(spreadTotals["Senior Debt"])}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {formatCurrency(seniorDebtAmount)} at {financing.lvr}% LVR
          </p>
        </div>

        {/* Mezzanine Debt (read-only from FinancingInputs) */}
        {financing.secondLvr ? (
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-gray-800">2. Mezzanine Debt</h4>
              {spreadTotals["Mezzanine Debt"] > 0 && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Spread: {formatCurrency(spreadTotals["Mezzanine Debt"])}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {formatCurrency(mezzanineDebtAmount)} at {financing.secondLvr}% LVR
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-200 p-3">
            <h4 className="text-sm font-semibold text-gray-400 mb-1">2. Mezzanine Debt</h4>
            <p className="text-xs text-gray-400">Configure in Financing section</p>
          </div>
        )}

        {/* Private Lending */}
        <div className="rounded-lg border border-gray-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800">3. Private Lending</h4>
            {spreadTotals["Private Lending"] > 0 && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Spread: {formatCurrency(spreadTotals["Private Lending"])}
              </span>
            )}
          </div>
          <Toggle
            options={[
              { label: "$ Amount", value: false },
              { label: "% of Cost", value: true },
            ]}
            value={capitalStack.privateLending.isPercentageOfCost}
            onChange={(value) =>
              updateStack({
                privateLending: { ...capitalStack.privateLending, isPercentageOfCost: value as boolean },
              })
            }
          />
          <div className="flex items-center">
            <NumberField
              label={capitalStack.privateLending.isPercentageOfCost ? "% of Total Cost" : "Amount"}
              value={capitalStack.privateLending.amount}
              onChange={(value) =>
                updateStack({
                  privateLending: { ...capitalStack.privateLending, amount: value },
                })
              }
              prefix={capitalStack.privateLending.isPercentageOfCost ? "" : "$"}
              suffix={capitalStack.privateLending.isPercentageOfCost ? "%" : ""}
              min={0}
            />
            {capitalStack.privateLending.isPercentageOfCost && (
              <ComputedDollarDisplay
                percentage={capitalStack.privateLending.amount}
                baseAmount={totalProjectCost}
                label="≈"
              />
            )}
          </div>
          <NumberField
            label="Interest Rate"
            value={capitalStack.privateLending.interestRate}
            onChange={(value) =>
              updateStack({
                privateLending: { ...capitalStack.privateLending, interestRate: value },
              })
            }
            suffix="%"
            min={0}
            step={0.01}
          />
        </div>

        {/* Profit Sharing */}
        <div className="rounded-lg border border-gray-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800">4. Profit Sharing</h4>
            {spreadTotals["Profit Sharing"] > 0 && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Spread: {formatCurrency(spreadTotals["Profit Sharing"])}
              </span>
            )}
          </div>
          <NumberField
            label="Amount Committed"
            value={capitalStack.profitSharing.amountCommitted}
            onChange={(value) =>
              updateStack({
                profitSharing: { ...capitalStack.profitSharing, amountCommitted: value },
              })
            }
            prefix="$"
            min={0}
          />
          <NumberField
            label="% on Total Capital"
            value={capitalStack.profitSharing.percentOfTotalCapital}
            onChange={(value) =>
              updateStack({
                profitSharing: { ...capitalStack.profitSharing, percentOfTotalCapital: value },
              })
            }
            suffix="%"
            min={0}
            max={100}
            step={0.1}
          />
          <NumberField
            label="% of Profit Share"
            value={capitalStack.profitSharing.percentOfProfit}
            onChange={(value) =>
              updateStack({
                profitSharing: { ...capitalStack.profitSharing, percentOfProfit: value },
              })
            }
            suffix="%"
            min={0}
            max={100}
            step={0.1}
          />
        </div>

        {/* Developer Equity */}
        <div className="rounded-lg border border-gray-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800">5. Developer Equity</h4>
            {spreadTotals["Developer Equity"] > 0 && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Spread: {formatCurrency(spreadTotals["Developer Equity"])}
              </span>
            )}
          </div>
          <Toggle
            options={[
              { label: "Auto", value: true },
              { label: "Manual", value: false },
            ]}
            value={capitalStack.developerEquity.isAutoComputed}
            onChange={(value) =>
              updateStack({
                developerEquity: { ...capitalStack.developerEquity, isAutoComputed: value as boolean },
              })
            }
          />
          {!capitalStack.developerEquity.isAutoComputed && (
            <NumberField
              label="Amount"
              value={capitalStack.developerEquity.amount}
              onChange={(value) =>
                updateStack({
                  developerEquity: { ...capitalStack.developerEquity, amount: value },
                })
              }
              prefix="$"
              min={0}
            />
          )}
        </div>

        {/* Other Equity */}
        <div className="rounded-lg border border-gray-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800">6. Other Equity</h4>
            {spreadTotals["Other Equity"] > 0 && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Spread: {formatCurrency(spreadTotals["Other Equity"])}
              </span>
            )}
          </div>
          <Toggle
            options={[
              { label: "$ Amount", value: false },
              { label: "% of Cost", value: true },
            ]}
            value={capitalStack.otherEquity.isPercentageOfCost}
            onChange={(value) =>
              updateStack({
                otherEquity: { ...capitalStack.otherEquity, isPercentageOfCost: value as boolean },
              })
            }
          />
          <div className="flex items-center">
            <NumberField
              label={capitalStack.otherEquity.isPercentageOfCost ? "% of Total Cost" : "Amount"}
              value={capitalStack.otherEquity.amount}
              onChange={(value) =>
                updateStack({
                  otherEquity: { ...capitalStack.otherEquity, amount: value },
                })
              }
              prefix={capitalStack.otherEquity.isPercentageOfCost ? "" : "$"}
              suffix={capitalStack.otherEquity.isPercentageOfCost ? "%" : ""}
              min={0}
            />
            {capitalStack.otherEquity.isPercentageOfCost && (
              <ComputedDollarDisplay
                percentage={capitalStack.otherEquity.amount}
                baseAmount={totalProjectCost}
                label="≈"
              />
            )}
          </div>
        </div>
      </div>
    </Collapsible>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}
