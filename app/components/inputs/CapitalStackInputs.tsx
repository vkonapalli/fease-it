import { useMemo } from "react";
import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Toggle } from "~/components/ui/Toggle";
import { ComputedDollarDisplay } from "~/components/ui/ComputedDollar";
import { Button } from "~/components/ui/Button";
import { useFormContext, Controller } from "react-hook-form";
import type { FeasibilityInputs } from "@fease-it/schemas";
import { asMoney, asPercentage, asNat, asPositiveInt } from "@fease-it/schemas";
import { RefreshCw } from "lucide-react";

interface CapitalStackInputsProps {
  totalProjectCost?: number;
}

export function CapitalStackInputs({ totalProjectCost: totalProjectCostProp }: CapitalStackInputsProps) {
  const { control, watch, setValue } = useFormContext<FeasibilityInputs>();
  
  const capitalStack = watch("capitalStack");
  const financing = watch("financing");
  const property = watch("property");
  const capitalSpread = watch("capitalSpread");

  const totalProjectCost = useMemo(() => {
    return totalProjectCostProp ?? property.purchasePrice;
  }, [totalProjectCostProp, property.purchasePrice]);

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

  function syncFromSpread() {
    const privateLendingTotal = spreadTotals["Private Lending"];
    if (privateLendingTotal && privateLendingTotal > 0 && !capitalStack.privateLending.isPercentageOfCost) {
      setValue("capitalStack.privateLending.amount", asMoney(privateLendingTotal));
    }

    const profitSharingTotal = spreadTotals["Profit Sharing"];
    if (profitSharingTotal && profitSharingTotal > 0) {
      setValue("capitalStack.profitSharing.amountCommitted", asMoney(profitSharingTotal));
    }

    const devEquityTotal = spreadTotals["Developer Equity"];
    if (devEquityTotal && devEquityTotal > 0) {
      setValue("capitalStack.developerEquity.isAutoComputed", false);
      setValue("capitalStack.developerEquity.amount", asMoney(devEquityTotal));
    }

    const otherEquityTotal = spreadTotals["Other Equity"];
    if (otherEquityTotal && otherEquityTotal > 0 && !capitalStack.otherEquity.isPercentageOfCost) {
      setValue("capitalStack.otherEquity.amount", asMoney(otherEquityTotal));
    }
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
            <h4 className="text-sm font-semibold text-gray-500 mb-1">2. Mezzanine Debt</h4>
            <p className="text-xs text-gray-500">Configure in Financing section</p>
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
          <Controller
            name="capitalStack.privateLending.isPercentageOfCost"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Toggle
                {...field}
                options={[
                  { label: "$ Amount", value: false },
                  { label: "% of Cost", value: true },
                ]}
                error={error?.message}
              />
            )}
          />
          <div className="flex items-center">
            <Controller
              name="capitalStack.privateLending.amount"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <NumberField
                  {...field}
                  label={capitalStack.privateLending.isPercentageOfCost ? "% of Total Cost" : "Amount"}
                  prefix={capitalStack.privateLending.isPercentageOfCost ? "" : "$"}
                  suffix={capitalStack.privateLending.isPercentageOfCost ? "%" : ""}
                  min={0}
                  error={error?.message}
                />
              )}
            />
            {capitalStack.privateLending.isPercentageOfCost && (
              <ComputedDollarDisplay
                percentage={capitalStack.privateLending.amount}
                baseAmount={totalProjectCost}
                label="≈"
              />
            )}
          </div>
          <Controller
            name="capitalStack.privateLending.interestRate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Interest Rate"
                suffix="%"
                min={0}
                step={0.01}
                error={error?.message}
              />
            )}
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
          <Controller
            name="capitalStack.profitSharing.amountCommitted"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Amount Committed"
                prefix="$"
                min={0}
                error={error?.message}
              />
            )}
          />
          <Controller
            name="capitalStack.profitSharing.percentOfTotalCapital"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="% on Total Capital"
                suffix="%"
                min={0}
                max={100}
                step={0.1}
                error={error?.message}
              />
            )}
          />
          <Controller
            name="capitalStack.profitSharing.percentOfProfit"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="% of Profit Share"
                suffix="%"
                min={0}
                max={100}
                step={0.1}
                error={error?.message}
              />
            )}
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
          <Controller
            name="capitalStack.developerEquity.isAutoComputed"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Toggle
                {...field}
                options={[
                  { label: "Auto", value: true },
                  { label: "Manual", value: false },
                ]}
                error={error?.message}
              />
            )}
          />
          {!capitalStack.developerEquity.isAutoComputed && (
            <Controller
              name="capitalStack.developerEquity.amount"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <NumberField
                  {...field}
                  label="Amount"
                  prefix="$"
                  min={0}
                  error={error?.message}
                />
              )}
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
          <Controller
            name="capitalStack.otherEquity.isPercentageOfCost"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Toggle
                {...field}
                options={[
                  { label: "$ Amount", value: false },
                  { label: "% of Cost", value: true },
                ]}
                error={error?.message}
              />
            )}
          />
          <div className="flex items-center">
            <Controller
              name="capitalStack.otherEquity.amount"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <NumberField
                  {...field}
                  label={capitalStack.otherEquity.isPercentageOfCost ? "% of Total Cost" : "Amount"}
                  prefix={capitalStack.otherEquity.isPercentageOfCost ? "" : "$"}
                  suffix={capitalStack.otherEquity.isPercentageOfCost ? "%" : ""}
                  min={0}
                  error={error?.message}
                />
              )}
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
