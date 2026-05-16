import { useMemo } from "react";
import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Toggle } from "~/components/ui/Toggle";
import { ComputedDollarDisplay } from "~/components/ui/ComputedDollar";
import { useAppStore } from "~/stores/appStore";
import { useShallow } from "zustand/react/shallow";

const LVR_BASE_OPTIONS = [
  { label: "Net GRV", value: "net-grv" as const },
  { label: "Net Costs", value: "net-project-costs" as const },
];

export function FinancingInputs() {
  const financing = useAppStore(useShallow((s) => s.getActiveScenario()!.inputs.financing));
  const property = useAppStore(useShallow((s) => s.getActiveScenario()!.inputs.property));
  const updateActiveInputs = useAppStore((s) => s.updateActiveInputs);

  const loanAmount = useMemo(() => {
    return property.purchasePrice * (financing.lvr / 100);
  }, [property.purchasePrice, financing.lvr]);

  const secondLoanAmount = useMemo(() => {
    if (!financing.secondLvr || financing.secondLvr <= 0) return 0;
    return property.purchasePrice * (financing.secondLvr / 100);
  }, [property.purchasePrice, financing.secondLvr]);

  return (
    <Collapsible title="Financing">
      <div className="space-y-4">
        <div className="flex items-center">
          <NumberField
            label="Loan-to-Value Ratio (LVR)"
            value={financing.lvr}
            onChange={(value) => updateActiveInputs({ financing: { ...financing!, lvr: value } })}
            suffix="%"
            min={0}
            max={100}
            step={1}
          />
          <ComputedDollarDisplay
            percentage={financing.lvr}
            baseAmount={property.purchasePrice}
            label="≈"
          />
        </div>
        <Toggle
          label="LVR Base"
          options={LVR_BASE_OPTIONS}
          value={financing.lvrBase}
          onChange={(value) => updateActiveInputs({ financing: { ...financing!, lvrBase: value as "net-grv" | "net-project-costs" } })}
        />
        <NumberField
          label="Interest Rate"
          value={financing.interestRate}
          onChange={(value) => updateActiveInputs({ financing: { ...financing!, interestRate: value } })}
          suffix="%"
          min={0}
          max={30}
          step={0.01}
        />
        <NumberField
          label="Loan Term"
          value={financing.loanTermMonths}
          onChange={(value) => updateActiveInputs({ financing: { ...financing!, loanTermMonths: value } })}
          suffix="months"
          min={1}
          max={360}
        />
        <div className="flex items-center">
          <NumberField
            label="Establishment Fee"
            value={financing.establishmentFeePercent}
            onChange={(value) => updateActiveInputs({ financing: { ...financing!, establishmentFeePercent: value } })}
            suffix="%"
            min={0}
            max={10}
            step={0.01}
          />
          <ComputedDollarDisplay
            percentage={financing.establishmentFeePercent}
            baseAmount={loanAmount}
            label="≈"
          />
        </div>
        <div className="flex items-center">
          <NumberField
            label="Broker Fee"
            value={financing.brokerFeePercent}
            onChange={(value) => updateActiveInputs({ financing: { ...financing!, brokerFeePercent: value } })}
            suffix="%"
            min={0}
            max={10}
            step={0.01}
          />
          <ComputedDollarDisplay
            percentage={financing.brokerFeePercent}
            baseAmount={loanAmount}
            label="≈"
          />
        </div>
        <NumberField
          label="Settlement Fee"
          value={financing.settlementFee}
          onChange={(value) => updateActiveInputs({ financing: { ...financing!, settlementFee: value } })}
          prefix="$"
          min={0}
        />
        <NumberField
          label="Deferred Fee (months interest)"
          value={financing.deferredFeeMonths}
          onChange={(value) => updateActiveInputs({ financing: { ...financing!, deferredFeeMonths: value } })}
          suffix="months"
          min={0}
          max={12}
        />

        {/* Second loan */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Second / Mezzanine Loan (Optional)</h4>
          <div className="flex items-center">
            <NumberField
              label="Second LVR"
              value={financing.secondLvr ?? 0}
              onChange={(value) => updateActiveInputs({ financing: { ...financing!, secondLvr: value > 0 ? value : undefined } })}
              suffix="%"
              min={0}
              max={100}
            />
            <ComputedDollarDisplay
              percentage={financing.secondLvr ?? 0}
              baseAmount={property.purchasePrice}
              label="≈"
            />
          </div>
          <Toggle
            label="Second LVR Base"
            options={LVR_BASE_OPTIONS}
            value={financing.secondLvrBase ?? financing.lvrBase}
            onChange={(value) => updateActiveInputs({ financing: { ...financing!, secondLvrBase: value as "net-grv" | "net-project-costs" } })}
          />
          <NumberField
            label="Second Interest Rate"
            value={financing.secondInterestRate ?? 0}
            onChange={(value) => updateActiveInputs({ financing: { ...financing!, secondInterestRate: value > 0 ? value : undefined } })}
            suffix="%"
            min={0}
            max={50}
            step={0.01}
          />
        </div>
      </div>
    </Collapsible>
  );
}
