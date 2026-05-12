import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { useFeasibilityStore } from "~/stores/feasibilityStore";

export function FinancingInputs() {
  const { inputs, setInputs } = useFeasibilityStore();
  const { financing } = inputs;

  return (
    <Collapsible title="Financing">
      <div className="space-y-4">
        <NumberField
          label="Loan-to-Value Ratio (LVR)"
          value={financing.lvr}
          onChange={(value) => setInputs({ financing: { ...financing, lvr: value } })}
          suffix="%"
          min={0}
          max={100}
          step={1}
        />
        <NumberField
          label="Interest Rate"
          value={financing.interestRate}
          onChange={(value) => setInputs({ financing: { ...financing, interestRate: value } })}
          suffix="%"
          min={0}
          max={30}
          step={0.01}
        />
        <NumberField
          label="Loan Term"
          value={financing.loanTermMonths}
          onChange={(value) => setInputs({ financing: { ...financing, loanTermMonths: value } })}
          suffix="months"
          min={1}
          max={360}
        />
        <NumberField
          label="Establishment Fee"
          value={financing.establishmentFeePercent}
          onChange={(value) => setInputs({ financing: { ...financing, establishmentFeePercent: value } })}
          suffix="%"
          min={0}
          max={10}
          step={0.01}
        />
        <NumberField
          label="Broker Fee"
          value={financing.brokerFeePercent}
          onChange={(value) => setInputs({ financing: { ...financing, brokerFeePercent: value } })}
          suffix="%"
          min={0}
          max={10}
          step={0.01}
        />
        <NumberField
          label="Settlement Fee"
          value={financing.settlementFee}
          onChange={(value) => setInputs({ financing: { ...financing, settlementFee: value } })}
          prefix="$"
          min={0}
        />
        <NumberField
          label="Deferred Fee (months interest)"
          value={financing.deferredFeeMonths}
          onChange={(value) => setInputs({ financing: { ...financing, deferredFeeMonths: value } })}
          suffix="months"
          min={0}
          max={12}
        />

        {/* Second loan */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Second / Mezzanine Loan (Optional)</h4>
          <NumberField
            label="Second LVR"
            value={financing.secondLvr ?? 0}
            onChange={(value) => setInputs({ financing: { ...financing, secondLvr: value > 0 ? value : undefined } })}
            suffix="%"
            min={0}
            max={100}
          />
          <NumberField
            label="Second Interest Rate"
            value={financing.secondInterestRate ?? 0}
            onChange={(value) => setInputs({ financing: { ...financing, secondInterestRate: value > 0 ? value : undefined } })}
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
