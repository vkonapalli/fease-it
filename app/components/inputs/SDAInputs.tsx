import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Toggle } from "~/components/ui/Toggle";
import { useFormContext, Controller } from "react-hook-form";
import type { FeasibilityInputs, SDAUnitConfig } from "~/types";

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
  const { control } = useFormContext<FeasibilityInputs>();

  return (
    <Collapsible title="SDA (Disability Housing)">
      <div className="space-y-4">
        <Controller
          name="sda.units"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <NumberField
              {...field}
              label="Number of SDA Units"
              min={1}
              max={20}
              error={error?.message}
            />
          )}
        />

        <Controller
          name="sda.sdaScenario"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Toggle
              {...field}
              label="SDA Uptake Scenario"
              options={SDA_SCENARIO_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
              error={error?.message}
            />
          )}
        />

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">NDIS Revenue Rates (Monthly per Unit)</h4>
          <Controller
            name="sda.sdaBasicMonthly"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="SDA Basic Payment"
                prefix="$"
                min={0}
                error={error?.message}
              />
            )}
          />
          <Controller
            name="sda.rrcMonthly"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="RRC (Resident Contribution)"
                prefix="$"
                min={0}
                error={error?.message}
              />
            )}
          />
          <Controller
            name="sda.ooaLeaseMonthly"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="OOA Lease Component"
                prefix="$"
                min={0}
                error={error?.message}
              />
            )}
          />
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Revenue Sharing</h4>
          <Controller
            name="sda.landlordSharePercent"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Landlord Share %"
                suffix="%"
                min={0}
                max={100}
                error={error?.message}
              />
            )}
          />
          <Controller
            name="sda.providerFeePercent"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Provider Fee %"
                suffix="%"
                min={0}
                max={100}
                error={error?.message}
              />
            )}
          />
          <Controller
            name="sda.landlordGuaranteedAnnual"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Landlord Guaranteed Annual"
                prefix="$"
                min={0}
                error={error?.message}
              />
            )}
          />
          <Controller
            name="sda.excessRevenueSplit"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Toggle
                {...field}
                label="Excess Revenue Split"
                options={SPLIT_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
                error={error?.message}
              />
            )}
          />
        </div>
      </div>
    </Collapsible>
  );
}
