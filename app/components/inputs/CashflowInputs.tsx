import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Button } from "~/components/ui/Button";
import { Toggle } from "~/components/ui/Toggle";
import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import type { FeasibilityInputs, CashflowFrequency } from "@fease-it/schemas";
import { asMoney, asPercentage, asNat, asPositiveInt } from "@fease-it/schemas";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";

const FREQ_OPTIONS: { label: string; value: CashflowFrequency }[] = [
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Annual", value: "annual" },
];

export function CashflowInputs() {
  const { control, watch, setValue } = useFormContext<FeasibilityInputs>();
  const cashflow = watch("cashflow");

  const { fields: phaseFields, append: appendPhase, remove: removePhase } = useFieldArray({
    control,
    name: "cashflow.phases",
  });

  return (
    <Collapsible title="Cashflow Configuration">
      <div className="space-y-4">
        <Controller
          name="cashflow.frequency"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Toggle
              {...field}
              label="Frequency"
              options={FREQ_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
              error={error?.message}
            />
          )}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <Controller
            name="cashflow.startDate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <input aria-label="Date"                 {...field}
                type="date"
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm",
                  error ? "border-error focus:ring-error" : "border-gray-300"
                )}
              />
            )}
          />
        </div>

        {phaseFields.map((phase, pIndex) => (
          <div key={phase.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <Controller
                  name={`cashflow.phases.${pIndex}.name`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <input aria-label="Input field"                       {...field}
                      type="text"
                      className={cn(
                        "font-medium text-sm bg-transparent border-none p-0 focus:ring-0",
                        error ? "text-error placeholder:text-error/50" : ""
                      )}
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => removePhase(pIndex)}
                  aria-label="Delete item" className="text-error hover:text-error/80 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <Controller
              name={`cashflow.phases.${pIndex}.months`}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <NumberField
                  {...field}
                  label="Duration (months)"
                  suffix="months"
                  min={1}
                  error={error?.message}
                />
              )}
            />

            {/* Income */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-success">Income</p>
              {cashflow.phases[pIndex].income.map((item, iIndex) => (
                <div key={iIndex} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Controller
                      name={`cashflow.phases.${pIndex}.income.${iIndex}.name`}
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <input aria-label="Input field"                           {...field}
                          type="text"
                          className={cn(
                            "flex-1 rounded border px-2 py-1 text-xs",
                            error ? "border-error focus:ring-error" : "border-gray-200"
                          )}
                        />
                      )}
                    />
                    <Controller
                      name={`cashflow.phases.${pIndex}.income.${iIndex}.amount`}
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
                    <Controller
                      name={`cashflow.phases.${pIndex}.income.${iIndex}.frequency`}
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <select aria-label="Select option"                           {...field}
                          className={cn(
                            "rounded border px-2 py-1 text-xs bg-white",
                            error ? "border-error focus:ring-error" : "border-gray-200"
                          )}
                        >
                          <option value="once">Once</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newIncome = cashflow.phases[pIndex].income.filter((_, i) => i !== iIndex);
                        setValue(`cashflow.phases.${pIndex}.income`, newIncome);
                      }}
                      className="text-error p-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  const newItem = { name: "New Item", amount: asMoney(0), frequency: "once" as const };
                  setValue(`cashflow.phases.${pIndex}.income`, [...cashflow.phases[pIndex].income, newItem]);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Income
              </Button>
            </div>

            {/* Costs */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-error">Costs</p>
              {cashflow.phases[pIndex].costs.map((item, cIndex) => (
                <div key={cIndex} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Controller
                      name={`cashflow.phases.${pIndex}.costs.${cIndex}.name`}
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <input aria-label="Input field"                           {...field}
                          type="text"
                          className={cn(
                            "flex-1 rounded border px-2 py-1 text-xs",
                            error ? "border-error focus:ring-error" : "border-gray-200"
                          )}
                        />
                      )}
                    />
                    <Controller
                      name={`cashflow.phases.${pIndex}.costs.${cIndex}.amount`}
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
                    <Controller
                      name={`cashflow.phases.${pIndex}.costs.${cIndex}.frequency`}
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <select aria-label="Select option"                           {...field}
                          className={cn(
                            "rounded border px-2 py-1 text-xs bg-white",
                            error ? "border-error focus:ring-error" : "border-gray-200"
                          )}
                        >
                          <option value="once">Once</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newCosts = cashflow.phases[pIndex].costs.filter((_, i) => i !== cIndex);
                        setValue(`cashflow.phases.${pIndex}.costs`, newCosts);
                      }}
                      className="text-error p-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  const newItem = { name: "New Item", amount: asMoney(0), frequency: "once" as const };
                  setValue(`cashflow.phases.${pIndex}.costs`, [...cashflow.phases[pIndex].costs, newItem]);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Cost
              </Button>
            </div>
          </div>
        ))}

        <Button variant="ghost" size="sm" onClick={() => appendPhase({
          id: crypto.randomUUID(),
          name: `Phase ${phaseFields.length + 1}`,
          months: asPositiveInt(1),
          costs: [],
          income: [],
        })}>
          <Plus className="h-4 w-4 mr-1" /> Phase
        </Button>
      </div>
    </Collapsible>
  );
}
