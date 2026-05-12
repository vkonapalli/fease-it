import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Toggle } from "~/components/ui/Toggle";
import { useFeasibilityStore } from "~/stores/feasibilityStore";
import type { SDAUnitConfig } from "~/types";

const SDA_SCENARIO_OPTIONS: { label: string; value: SDAUnitConfig["sdaScenario"] }[] = [
  { label: "Full SDA", value: "full" },
  { label: "50% SDA", value: "50" },
  { label: "No SDA", value: "none" },
];

const SPLIT_OPTIONS: { label: string; value: SDAUnitConfig["excessRevenueSplit"] }[] = [
  { label: "50/50", value: "50-50" },
  { label: "75/25", value: "75-25" },
  { label: "70/30", value: "70-30" },
  { label: "60/40", value: "60-40" },
];

export function SDAInputs() {
  const { inputs, setInputs } = useFeasibilityStore();
  const { sda } = inputs;

  const updateSDA = (updates: Partial<SDAUnitConfig>) => {
    setInputs({ sda: { ...sda, ...updates } });
  };

  return (
    <Collapsible title="SDA (Disability Housing)">
      <div className="space-y-4">
        <NumberField
          label="Number of SDA Units"
          value={sda.units}
          onChange={(value) => updateSDA({ units: value })}
          min={1}
          max={20}
        />

        <Toggle
          label="SDA Uptake Scenario"
          options={SDA_SCENARIO_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          value={sda.sdaScenario}
          onChange={(value) => updateSDA({ sdaScenario: value as SDAUnitConfig["sdaScenario"] })}
        />

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">NDIS Revenue Rates (Monthly per Unit)</h4>
          <NumberField
            label="SDA Basic Payment"
            value={sda.sdaBasicMonthly}
            onChange={(value) => updateSDA({ sdaBasicMonthly: value })}
            prefix="$"
            min={0}
          />
          <NumberField
            label="RRC (Resident Contribution)"
            value={sda.rrcMonthly}
            onChange={(value) => updateSDA({ rrcMonthly: value })}
            prefix="$"
            min={0}
          />
          <NumberField
            label="OOA Lease Component"
            value={sda.ooaLeaseMonthly}
            onChange={(value) => updateSDA({ ooaLeaseMonthly: value })}
            prefix="$"
            min={0}
          />
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Revenue Sharing</h4>
          <NumberField
            label="Landlord Share %"
            value={sda.landlordSharePercent}
            onChange={(value) => updateSDA({ landlordSharePercent: value })}
            suffix="%"
            min={0}
            max={100}
          />
          <NumberField
            label="Provider Fee %"
            value={sda.providerFeePercent}
            onChange={(value) => updateSDA({ providerFeePercent: value })}
            suffix="%"
            min={0}
            max={100}
          />
          <NumberField
            label="Landlord Guaranteed Annual"
            value={sda.landlordGuaranteedAnnual}
            onChange={(value) => updateSDA({ landlordGuaranteedAnnual: value })}
            prefix="$"
            min={0}
          />
          <Toggle
            label="Excess Revenue Split"
            options={SPLIT_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            value={sda.excessRevenueSplit}
            onChange={(value) => updateSDA({ excessRevenueSplit: value as SDAUnitConfig["excessRevenueSplit"] })}
          />
        </div>
      </div>
    </Collapsible>
  );
}
