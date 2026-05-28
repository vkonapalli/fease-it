import { useMemo } from "react";
import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Button } from "~/components/ui/Button";
import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import type { FeasibilityInputs } from "~/types";
import { asMoney, asPercentage, asNat, asPositiveInt } from "~/lib/fundamental-types";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency, cn } from "~/lib/utils";

export function BudgetVsActualInputs() {
  const { control, watch } = useFormContext<FeasibilityInputs>();
  const budgetVsActual = watch("budgetVsActual");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "budgetVsActual.items",
  });

  const totals = useMemo(() => {
    const totalBudget = fields.reduce((sum, _, i) => sum + (budgetVsActual.items[i]?.budget ?? 0), 0);
    const totalActual = fields.reduce((sum, _, i) => sum + (budgetVsActual.items[i]?.actual ?? 0), 0);
    return {
      totalBudget,
      totalActual,
      totalVariance: totalActual - totalBudget,
    };
  }, [fields, budgetVsActual.items]);

  return (
    <Collapsible title="Budget vs Actual">
      <div className="space-y-3">
        {/* Header row - hidden on mobile */}
        <div className="hidden sm:grid sm:grid-cols-[1fr,110px,110px,110px,70px,32px] gap-2 items-center text-xs font-medium text-gray-500">
          <div>Category</div>
          <div className="text-right">Budget</div>
          <div className="text-right">Actual</div>
          <div className="text-right">Variance</div>
          <div className="text-right">%</div>
          <div></div>
        </div>

        {fields.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-1 sm:grid-cols-[1fr,110px,110px,110px,70px,32px] gap-2 items-start sm:items-center bg-gray-50 sm:bg-transparent rounded-lg p-3 sm:p-0"
          >
            <div className="flex items-center gap-2">
              <Controller
                name={`budgetVsActual.items.${index}.category`}
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <div className="w-full">
                    <input aria-label="Input field"                       {...field}
                      type="text"
                      className={cn(
                        "w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm",
                        error && "border-error focus:border-error focus:ring-error"
                      )}
                    />
                    {error && <p className="text-[10px] text-error mt-0.5">{error.message}</p>}
                  </div>
                )}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
              <span className="sm:hidden text-xs text-gray-500">Budget</span>
              <Controller
                name={`budgetVsActual.items.${index}.budget`}
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <NumberField
                    {...field}
                    label=""
                    prefix="$"
                    min={0}
                    error={error?.message}
                  />
                )}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
              <span className="sm:hidden text-xs text-gray-500">Actual</span>
              <Controller
                name={`budgetVsActual.items.${index}.actual`}
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <NumberField
                    {...field}
                    label=""
                    prefix="$"
                    min={0}
                    error={error?.message}
                  />
                )}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 items-center">
              <span className="sm:hidden text-xs text-gray-500">Variance</span>
              <div className={`text-sm font-mono text-right ${(budgetVsActual.items[index]?.actual ?? 0) - (budgetVsActual.items[index]?.budget ?? 0) >= 0 ? "text-success" : "text-error"}`}>
                {formatCurrency((budgetVsActual.items[index]?.actual ?? 0) - (budgetVsActual.items[index]?.budget ?? 0))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 items-center">
              <span className="sm:hidden text-xs text-gray-500">%</span>
              <div className="text-xs font-mono text-right text-gray-500">
                {budgetVsActual.items[index]?.budget > 0 ? `${(((budgetVsActual.items[index]?.actual ?? 0) - (budgetVsActual.items[index]?.budget ?? 0)) / budgetVsActual.items[index]?.budget * 100).toFixed(1)}%` : "—"}
              </div>
            </div>
            <div className="flex justify-end">
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

        {/* Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,110px,110px,110px,70px,32px] gap-2 items-center border-t border-gray-200 pt-2 mt-2 font-semibold">
          <div className="text-sm">Total</div>
          <div className="hidden sm:block text-sm font-mono text-right">{formatCurrency(totals.totalBudget)}</div>
          <div className="hidden sm:block text-sm font-mono text-right">{formatCurrency(totals.totalActual)}</div>
          <div className={`hidden sm:block text-sm font-mono text-right ${totals.totalVariance >= 0 ? "text-success" : "text-error"}`}>
            {formatCurrency(totals.totalVariance)}
          </div>
          <div className="hidden sm:block"></div>
          <div className="hidden sm:block"></div>
          {/* Mobile total summary */}
          <div className="sm:hidden col-span-full text-sm space-y-1 bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between"><span className="text-gray-500">Budget:</span><span className="font-mono">{formatCurrency(totals.totalBudget)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Actual:</span><span className="font-mono">{formatCurrency(totals.totalActual)}</span></div>
            <div className={`flex justify-between ${totals.totalVariance >= 0 ? "text-success" : "text-error"}`}>
              <span>Variance:</span><span className="font-mono">{formatCurrency(totals.totalVariance)}</span>
            </div>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={() => append({ id: crypto.randomUUID(), category: "New Item", budget: asMoney(0), actual: asMoney(0), variance: 0, variancePercent: 0 })}>
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>
    </Collapsible>
  );
}
