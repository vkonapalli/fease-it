import { useMemo } from "react";
import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Toggle } from "~/components/ui/Toggle";
import { ComputedDollarDisplay } from "~/components/ui/ComputedDollar";
import { useFormContext, Controller } from "react-hook-form";
import type { FeasibilityInputs, GSTTreatment } from "@fease-it/schemas";

const GST_OPTIONS: { label: string; value: GSTTreatment }[] = [
  { label: "GST-Free (Existing Residential)", value: "gst-free" },
  { label: "Full GST (10%)", value: "full-gst" },
  { label: "Input Taxed (Rental)", value: "input-taxed" },
  { label: "Going Concern", value: "going-concern" },
];

export function RevenueInputs() {
  const { control, watch } = useFormContext<FeasibilityInputs>();
  
  const revenue = watch("revenue");
  const property = watch("property");
  const development = watch("development");

  const totalRevenue = useMemo(() => {
    switch (development.strategy.pricingModel) {
      case "average":
        return development.strategy.averagePricePerLot * development.numDwellings;
      case "individual":
        return development.lots.reduce((sum, l) => sum + l.salePrice, 0);
      case "per-sqm":
        return development.lots.reduce((sum, l) => sum + development.strategy.pricePerSqm * l.landAreaSqm, 0);
      case "group-size":
        return development.lots.reduce((sum, l) => {
          const group = development.strategy.lotSizeGroups.find(
            (g) => l.landAreaSqm >= g.minSqm && l.landAreaSqm <= g.maxSqm
          );
          return sum + (group?.pricePerLot ?? l.salePrice);
        }, 0);
      default:
        return development.lots.reduce((sum, l) => sum + l.salePrice, 0);
    }
  }, [development]);

  return (
    <Collapsible title="Revenue & GST">
      <div className="space-y-4">
        {/* Margin Scheme Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Apply Margin Scheme</span>
          <Controller
            name="revenue.applyMarginScheme"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Toggle
                {...field}
                options={[
                  { label: "Off", value: false },
                  { label: "On", value: true },
                ]}
                error={error?.message}
              />
            )}
          />
        </div>

        {revenue.applyMarginScheme && (
          <Controller
            name="revenue.gst.costBasePerLot"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Cost Base per Lot (for Margin Scheme)"
                value={field.value ?? property.purchasePrice / development.numDwellings}
                prefix="$"
                min={0}
                error={error?.message}
              />
            )}
          />
        )}

        {!revenue.applyMarginScheme && (
          <Controller
            name="revenue.gst.treatment"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Toggle
                {...field}
                label="GST Treatment"
                options={GST_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
                error={error?.message}
              />
            )}
          />
        )}

        <Controller
          name="revenue.capitalGrowthRate"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <NumberField
              {...field}
              label="Capital Growth Rate (p.a.)"
              value={field.value * 100}
              onChange={(v) => field.onChange(v / 100)}
              suffix="%"
              min={0}
              max={50}
              step={0.1}
              error={error?.message}
            />
          )}
        />

        {/* Sales Commission */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Sales Commission</h4>
          <Controller
            name="revenue.salesCommissionType"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Toggle
                {...field}
                options={[
                  { label: "% Based", value: "percentage" },
                  { label: "Flat Fee", value: "flat" },
                ]}
                error={error?.message}
              />
            )}
          />
          {revenue.salesCommissionType === "percentage" ? (
            <div className="flex items-center mt-2">
              <Controller
                name="revenue.salesCommissionPercent"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <NumberField
                    {...field}
                    label="Commission %"
                    suffix="%"
                    min={0}
                    max={100}
                    step={0.1}
                    error={error?.message}
                  />
                )}
              />
              <ComputedDollarDisplay
                percentage={revenue.salesCommissionPercent}
                baseAmount={totalRevenue}
                label="≈"
              />
            </div>
          ) : (
            <div className="mt-2">
              <Controller
                name="revenue.salesCommissionFlat"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <NumberField
                    {...field}
                    label="Flat Fee"
                    prefix="$"
                    min={0}
                    error={error?.message}
                  />
                )}
              />
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Rental Assumptions (Hold Scenarios)</h4>
          <Controller
            name="revenue.rentalIncomePerUnitPerWeek"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Rent per Unit / Week"
                prefix="$"
                min={0}
                error={error?.message}
              />
            )}
          />
          <Controller
            name="revenue.numUnitsForRent"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Number of Units for Rent"
                min={0}
                error={error?.message}
              />
            )}
          />
          <Controller
            name="revenue.rentalGrowthRate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Rental Growth Rate"
                value={field.value * 100}
                onChange={(v) => field.onChange(v / 100)}
                suffix="%"
                min={0}
                max={50}
                step={0.1}
                error={error?.message}
              />
            )}
          />
          <Controller
            name="revenue.vacancyRate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Vacancy Rate"
                value={field.value * 100}
                onChange={(v) => field.onChange(v / 100)}
                suffix="%"
                min={0}
                max={100}
                step={0.1}
                error={error?.message}
              />
            )}
          />
          <Controller
            name="revenue.rentalShadingPercent"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Rental Shading (Bank %)"
                suffix="%"
                min={0}
                max={100}
                error={error?.message}
              />
            )}
          />
        </div>
      </div>
    </Collapsible>
  );
}
