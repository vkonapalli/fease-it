import { useMemo } from "react";
import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Button } from "~/components/ui/Button";
import { Toggle } from "~/components/ui/Toggle";
import { GSTToggle } from "~/components/ui/GSTToggle";
import { ComputedDollarDisplay } from "~/components/ui/ComputedDollar";
import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import type { FeasibilityInputs } from "~/types";
import { asMoney, asPercentage, asNat, asPositiveInt } from "~/lib/fundamental-types";
import { calculateRevenue } from "~/lib/calculations/profit";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";

export function DevelopmentInputs() {
  const { control, watch, setValue } = useFormContext<FeasibilityInputs>();
  const development = watch("development");

  const { totalRevenue } = useMemo(() => calculateRevenue(development), [development]);

  const { fields: lotFields, append: appendLot, remove: removeLot } = useFieldArray({
    control,
    name: "development.lots",
  });

  const { fields: globalCostFields, append: appendGlobalCost, remove: removeGlobalCost } = useFieldArray({
    control,
    name: "development.globalCosts",
  });

  // Compute construction cost for contingency base
  const constructionCost = useMemo(() => {
    return development.lots.reduce((sum, lot) => {
      return lot.hasConstruction ? sum + development.constructionCostPerSqm * lot.buildAreaSqm : sum;
    }, 0);
  }, [development.lots, development.constructionCostPerSqm]);

  // Compute other global costs for contingency base
  const otherCosts = useMemo(() => {
    return development.globalCosts.reduce((sum, cost) => {
      let amount = cost.isPercentage ? totalRevenue * (cost.amount / 100) : cost.amount;
      if (cost.applyPerLot) amount *= development.numDwellings;
      return sum + amount;
    }, 0);
  }, [development.globalCosts, totalRevenue, development.numDwellings]);

  const contingencyBase = constructionCost + otherCosts;

  const handleGlobalGSTToggle = (value: "free" | "inclusive" | "exclusive") => {
    if (value === "free") return;
    setValue("development.gstGlobalTreatment", value);
    development.globalCosts.forEach((c, index) => {
       if (c.gstTreatment !== "free") {
         setValue(`development.globalCosts.${index}.gstTreatment`, value);
       }
    });
  };

  const handleAddLot = () => {
    const newId = Math.max(...development.lots.map((l) => l.id), 0) + 1;
    appendLot({
      id: asNat(newId),
      name: `Block ${newId}`,
      salePrice: asMoney(1775000),
      buildAreaSqm: 0,
      landAreaSqm: 647.5,
      isHeld: false,
      hasConstruction: false,
    });
    setValue("development.numDwellings", asPositiveInt(development.numDwellings + 1));
  };

  const handleRemoveLot = (index: number) => {
    if (development.lots.length <= 1) return;
    removeLot(index);
    setValue("development.numDwellings", asPositiveInt(development.numDwellings - 1));
  };

  return (
    <Collapsible title="Development Costs">
      <div className="space-y-6">
        {/* Lots */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Lots / Dwellings</h4>
          <div className="space-y-3">
            {lotFields.map((lot, index) => (
              <div key={lot.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Controller
                    name={`development.lots.${index}.name`}
                    control={control}
                    render={({ field }) => (
                      <input aria-label="Input field"                         {...field}
                        type="text"
                        className="font-medium text-sm bg-transparent border-none p-0 focus:ring-0"
                      />
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveLot(index)}
                    aria-label="Delete item" className="text-error hover:text-error/80 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Controller
                    name={`development.lots.${index}.salePrice`}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <NumberField
                        {...field}
                        label="Sale Price"
                        prefix="$"
                        min={0}
                        error={error?.message}
                      />
                    )}
                  />
                  <Controller
                    name={`development.lots.${index}.buildAreaSqm`}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <NumberField
                        {...field}
                        label="Build Area"
                        suffix="sqm"
                        min={0}
                        error={error?.message}
                      />
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  <Controller
                    name={`development.lots.${index}.isHeld`}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <Toggle
                        {...field}
                        options={[
                          { label: "Sell", value: false },
                          { label: "Hold", value: true },
                        ]}
                        error={error?.message}
                      />
                    )}
                  />
                  <Controller
                    name={`development.lots.${index}.hasConstruction`}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <Toggle
                        {...field}
                        options={[
                          { label: "No Build", value: false },
                          { label: "Build", value: true },
                        ]}
                        error={error?.message}
                      />
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={handleAddLot} className="mt-2">
            <Plus className="h-4 w-4 mr-1" /> Add Lot
          </Button>
        </div>

        {/* Construction */}
        <Controller
          name="development.constructionCostPerSqm"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <NumberField
              {...field}
              label="Construction Cost per sqm"
              prefix="$"
              min={0}
              error={error?.message}
            />
          )}
        />

        {/* Global Costs */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Global Development Costs</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Global GST:</span>
              <GSTToggle
                value={development.gstGlobalTreatment}
                onChange={handleGlobalGSTToggle}
              />
            </div>
          </div>
          <div className="space-y-2">
            {globalCostFields.map((cost, index) => (
              <div key={cost.id} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Controller
                    name={`development.globalCosts.${index}.name`}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <input aria-label="Input field"                         {...field}
                        type="text"
                        className={cn(
                          "flex-1 min-w-[120px] rounded-lg border px-3 py-1.5 text-sm",
                          error ? "border-error focus:ring-error" : "border-gray-300"
                        )}
                      />
                    )}
                  />
                  <div className="flex items-center">
                    <Controller
                      name={`development.globalCosts.${index}.amount`}
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <NumberField
                          {...field}
                          label=""
                          prefix={development.globalCosts[index].isPercentage ? "" : "$"}
                          suffix={development.globalCosts[index].isPercentage ? "%" : ""}
                          min={0}
                          error={error?.message}
                        />
                      )}
                    />
                    {development.globalCosts[index].isPercentage && (
                      <ComputedDollarDisplay
                        percentage={development.globalCosts[index].amount}
                        baseAmount={totalRevenue}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue(`development.globalCosts.${index}.isPercentage`, !development.globalCosts[index].isPercentage)}
                    className={`px-2 py-1.5 text-xs rounded-md border ${
                      development.globalCosts[index].isPercentage
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-600 border-gray-300"
                    }`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue(`development.globalCosts.${index}.applyPerLot`, !development.globalCosts[index].applyPerLot)}
                    className={`px-2 py-1.5 text-xs rounded-md border ${
                      development.globalCosts[index].applyPerLot
                        ? "bg-accent text-white border-accent"
                        : "bg-white text-gray-600 border-gray-300"
                    }`}
                    title="Apply per lot"
                  >
                    ×{development.numDwellings}
                  </button>
                  <Controller
                    name={`development.globalCosts.${index}.gstTreatment`}
                    control={control}
                    render={({ field }) => (
                      <GSTToggle
                        {...field}
                      />
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => removeGlobalCost(index)}
                    aria-label="Delete item" className="text-error hover:text-error/80 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => appendGlobalCost({
            id: crypto.randomUUID(),
            name: "New Cost",
            amount: asMoney(0),
            isPercentage: false,
            applyPerLot: false,
            gstTreatment: "inclusive",
          })} className="mt-2">
            <Plus className="h-4 w-4 mr-1" /> Add Cost
          </Button>
        </div>

        <div className="flex items-center">
          <Controller
            name="development.contingencyPercent"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Contingency"
                suffix="%"
                min={0}
                max={50}
                error={error?.message}
              />
            )}
          />
          <ComputedDollarDisplay
            percentage={development.contingencyPercent}
            baseAmount={contingencyBase}
            label="≈"
          />
        </div>
      </div>
    </Collapsible>
  );
}
