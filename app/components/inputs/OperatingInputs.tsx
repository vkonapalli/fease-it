import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Button } from "~/components/ui/Button";
import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import type { FeasibilityInputs } from "~/types";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";

export function OperatingInputs() {
  const { control, setValue, watch } = useFormContext<FeasibilityInputs>();
  const operating = watch("operating");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "operating.costs",
  });

  return (
    <Collapsible title="Operating Costs (Hold)">
      <div className="space-y-4">
        <Controller
          name="operating.holdPeriodYears"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <NumberField
              {...field}
              label="Hold Period (Years)"
              suffix="years"
              min={1}
              max={50}
              error={error?.message}
            />
          )}
        />

        <div className="space-y-2">
          {fields.map((cost, index) => (
            <div key={cost.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Controller
                  name={`operating.costs.${index}.name`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <input
                      {...field}
                      type="text"
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-1.5 text-sm",
                        error ? "border-error focus:ring-error" : "border-gray-300"
                      )}
                    />
                  )}
                />
                <Controller
                  name={`operating.costs.${index}.annualAmount`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <NumberField
                      {...field}
                      label=""
                      prefix={operating.costs[index].isPercentageOfRent ? "" : "$"}
                      suffix={operating.costs[index].isPercentageOfRent ? "% of rent" : "/yr"}
                      min={0}
                      error={error?.message}
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => setValue(`operating.costs.${index}.isPercentageOfRent`, !operating.costs[index].isPercentageOfRent)}
                  className={`px-2 py-1.5 text-xs rounded-md border ${
                    operating.costs[index].isPercentageOfRent
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  %
                </button>
                <Controller
                  name={`operating.costs.${index}.escalationRate`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <NumberField
                      {...field}
                      label=""
                      value={field.value * 100}
                      onChange={(v) => field.onChange(v / 100)}
                      suffix="% esc"
                      min={0}
                      max={50}
                      step={0.1}
                      error={error?.message}
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-error hover:text-error/80 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => append({
          id: crypto.randomUUID(),
          name: "New Operating Cost",
          annualAmount: 0,
          isPercentageOfRent: false,
          escalationRate: 0,
        })}>
          <Plus className="h-4 w-4 mr-1" /> Add Cost
        </Button>
      </div>
    </Collapsible>
  );
}
