import { useMemo } from "react";
import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Toggle } from "~/components/ui/Toggle";
import { ComputedDollarDisplay } from "~/components/ui/ComputedDollar";
import { useFormContext, Controller } from "react-hook-form";
import type { FeasibilityInputs } from "~/types";

const LVR_BASE_OPTIONS = [
  { label: "Net GRV", value: "net-grv" as const },
  { label: "Net Costs", value: "net-project-costs" as const },
];

export function FinancingInputs() {
  const { control, watch } = useFormContext<FeasibilityInputs>();
  
  const financing = watch("financing");
  const property = watch("property");

  const loanAmount = useMemo(() => {
    return property.purchasePrice * (financing.lvr / 100);
  }, [property.purchasePrice, financing.lvr]);

  return (
    <Collapsible title="Financing">
      <div className="space-y-4">
        <div className="flex items-center">
          <Controller
            name="financing.lvr"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Loan-to-Value Ratio (LVR)"
                suffix="%"
                min={0}
                max={100}
                step={1}
                error={error?.message}
              />
            )}
          />
          <ComputedDollarDisplay
            percentage={financing.lvr}
            baseAmount={property.purchasePrice}
            label="≈"
          />
        </div>
        <Controller
          name="financing.lvrBase"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Toggle
              {...field}
              label="LVR Base"
              options={LVR_BASE_OPTIONS}
              error={error?.message}
            />
          )}
        />
        <Controller
          name="financing.interestRate"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <NumberField
              {...field}
              label="Interest Rate"
              suffix="%"
              min={0}
              max={30}
              step={0.01}
              error={error?.message}
            />
          )}
        />
        <Controller
          name="financing.loanTermMonths"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <NumberField
              {...field}
              label="Loan Term"
              suffix="months"
              min={1}
              max={360}
              error={error?.message}
            />
          )}
        />
        <div className="flex items-center">
          <Controller
            name="financing.establishmentFeePercent"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Establishment Fee"
                suffix="%"
                min={0}
                max={10}
                step={0.01}
                error={error?.message}
              />
            )}
          />
          <ComputedDollarDisplay
            percentage={financing.establishmentFeePercent}
            baseAmount={loanAmount}
            label="≈"
          />
        </div>
        <div className="flex items-center">
          <Controller
            name="financing.brokerFeePercent"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Broker Fee"
                suffix="%"
                min={0}
                max={10}
                step={0.01}
                error={error?.message}
              />
            )}
          />
          <ComputedDollarDisplay
            percentage={financing.brokerFeePercent}
            baseAmount={loanAmount}
            label="≈"
          />
        </div>
        <Controller
          name="financing.settlementFee"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <NumberField
              {...field}
              label="Settlement Fee"
              prefix="$"
              min={0}
              error={error?.message}
            />
          )}
        />
        <Controller
          name="financing.deferredFeeMonths"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <NumberField
              {...field}
              label="Deferred Fee (months interest)"
              suffix="months"
              min={0}
              max={12}
              error={error?.message}
            />
          )}
        />

        {/* Second loan */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Second / Mezzanine Loan (Optional)</h4>
          <div className="flex items-center">
            <Controller
              name="financing.secondLvr"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <NumberField
                  {...field}
                  label="Second LVR"
                  value={field.value ?? 0}
                  onChange={(value) => field.onChange(value > 0 ? value : undefined)}
                  suffix="%"
                  min={0}
                  max={100}
                  error={error?.message}
                />
              )}
            />
            <ComputedDollarDisplay
              percentage={financing.secondLvr ?? 0}
              baseAmount={property.purchasePrice}
              label="≈"
            />
          </div>
          <Controller
            name="financing.secondLvrBase"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Toggle
                {...field}
                label="Second LVR Base"
                options={LVR_BASE_OPTIONS}
                value={field.value ?? financing.lvrBase}
                error={error?.message}
              />
            )}
          />
          <Controller
            name="financing.secondInterestRate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Second Interest Rate"
                value={field.value ?? 0}
                onChange={(value) => field.onChange(value > 0 ? value : undefined)}
                suffix="%"
                min={0}
                max={50}
                step={0.01}
                error={error?.message}
              />
            )}
          />
        </div>
      </div>
    </Collapsible>
  );
}
