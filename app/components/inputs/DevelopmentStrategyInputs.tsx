import { Collapsible } from "~/components/ui/Collapsible";
import { Toggle } from "~/components/ui/Toggle";
import { NumberField } from "~/components/ui/NumberField";
import { Button } from "~/components/ui/Button";
import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import { cn } from "~/lib/utils";
import type { FeasibilityInputs } from "@fease-it/schemas";
import { asMoney, asPercentage, asNat, asPositiveInt } from "@fease-it/schemas";
import { Plus, Trash2 } from "lucide-react";

const STRATEGY_OPTIONS = [
  { label: "Sub-division", value: "sub-division" },
  { label: "Townhouse", value: "townhouse" },
  { label: "Apartments", value: "apartments" },
  { label: "Single House", value: "single-house" },
];

const PRICING_OPTIONS = [
  { label: "Average Price / Lot", value: "average" },
  { label: "Individual Price", value: "individual" },
  { label: "Group by Lot Size", value: "group-size" },
  { label: "Income / sqm", value: "per-sqm" },
];

export function DevelopmentStrategyInputs() {
  const { control, watch } = useFormContext<FeasibilityInputs>();
  const strategy = watch("development.strategy");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "development.strategy.lotSizeGroups",
  });

  return (
    <Collapsible title="Development Strategy" defaultOpen>
      <div className="space-y-4">
        <Controller
          name="development.strategy.strategyType"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Toggle
              {...field}
              label="Strategy Type"
              options={STRATEGY_OPTIONS}
              error={error?.message}
            />
          )}
        />

        <Controller
          name="development.strategy.pricingModel"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Toggle
              {...field}
              label="Pricing Model / Income"
              options={PRICING_OPTIONS}
              error={error?.message}
            />
          )}
        />

        {strategy.pricingModel === "average" && (
          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="development.strategy.averagePricePerLot"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <NumberField
                  {...field}
                  label="Average Sale Price per Lot"
                  prefix="$"
                  min={0}
                  error={error?.message}
                />
              )}
            />
            <Controller
              name="development.strategy.averageBuildAreaPerLot"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <NumberField
                  {...field}
                  label="Avg Built Area per Lot"
                  suffix="sqm"
                  min={0}
                  error={error?.message}
                />
              )}
            />
          </div>
        )}

        {strategy.pricingModel === "per-sqm" && (
          <Controller
            name="development.strategy.pricePerSqm"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Price per sqm"
                prefix="$"
                suffix="/sqm"
                min={0}
                error={error?.message}
              />
            )}
          />
        )}

        {strategy.pricingModel === "group-size" && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Lot Size Groups</div>
            {fields.map((group, index) => (
              <div key={group.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Controller
                    name={`development.strategy.lotSizeGroups.${index}.name`}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <div className="flex flex-col gap-1">
                        <input aria-label="Input field"                           {...field}
                          type="text"
                          className={cn(
                            "w-24 rounded-lg border px-2 py-1.5 text-sm",
                            error ? "border-error focus:ring-error" : "border-gray-300"
                          )}
                          placeholder="Name"
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name={`development.strategy.lotSizeGroups.${index}.minSqm`}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <NumberField
                        {...field}
                        label=""
                        suffix="sqm"
                        min={0}
                        placeholder="Min"
                        error={error?.message}
                      />
                    )}
                  />
                  <span className="text-gray-500">-</span>
                  <Controller
                    name={`development.strategy.lotSizeGroups.${index}.maxSqm`}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <NumberField
                        {...field}
                        label=""
                        suffix="sqm"
                        min={0}
                        placeholder="Max"
                        error={error?.message}
                      />
                    )}
                  />
                  <Controller
                    name={`development.strategy.lotSizeGroups.${index}.pricePerLot`}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <NumberField
                        {...field}
                        label=""
                        prefix="$"
                        min={0}
                        placeholder="Price"
                        error={error?.message}
                      />
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label="Delete item" className="text-error hover:text-error/80 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => append({
              id: crypto.randomUUID(),
              name: `Group ${fields.length + 1}`,
              minSqm: 0,
              maxSqm: 0,
              pricePerLot: asMoney(0),
            })}>
              <Plus className="h-4 w-4 mr-1" /> Add Group
            </Button>
          </div>
        )}

        {/* Stress Test */}
        <div className="border-t border-gray-200 pt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Stress Test (Lot Count)</div>
          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="development.strategy.minLots"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <NumberField
                  {...field}
                  label="Minimum Lots"
                  value={field.value ?? 0}
                  onChange={(value) => field.onChange(value > 0 ? value : null)}
                  min={0}
                  error={error?.message}
                />
              )}
            />
            {strategy.pricingModel !== "individual" && (
              <Controller
                name="development.strategy.maxLots"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <NumberField
                    {...field}
                    label="Maximum Lots"
                    value={field.value ?? 0}
                    onChange={(value) => field.onChange(value > 0 ? value : null)}
                    min={0}
                    error={error?.message}
                  />
                )}
              />
            )}
          </div>
        </div>
      </div>
    </Collapsible>
  );
}
