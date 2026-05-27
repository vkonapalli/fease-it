import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Button } from "~/components/ui/Button";
import { useFormContext, Controller, useFieldArray, useWatch } from "react-hook-form";
import type { FeasibilityInputs } from "~/types";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";

const SPREAD_TYPE_OPTIONS = [
  { label: "Deposit", value: "Deposit" },
  { label: "Progress", value: "Progress" },
  { label: "Final", value: "Final" },
];

const STACK_CATEGORIES = [
  "Senior Debt",
  "Mezzanine Debt",
  "Private Lending",
  "Profit Sharing",
  "Developer Equity",
  "Other Equity",
];

export function CapitalSpreadInputs() {
  const { control } = useFormContext<FeasibilityInputs>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "capitalSpread",
  });

  return (
    <Collapsible title="Capital Spread Schedule">
      <div className="space-y-3">
        {fields.length === 0 && (
          <p className="text-sm text-gray-500">No capital spread items yet.</p>
        )}
        {fields.map((item, index) => (
          <CapitalSpreadItem key={item.id} index={index} remove={remove} />
        ))}
        <Button variant="ghost" size="sm" onClick={() => append({
          id: crypto.randomUUID(),
          description: "New Spread Item",
          amount: 0,
          isPercentage: false,
          date: "",
          type: "Deposit",
        })}>
          <Plus className="h-4 w-4 mr-1" /> Add Spread Item
        </Button>
      </div>
    </Collapsible>
  );
}

function CapitalSpreadItem({ index, remove }: { index: number; remove: (index: number) => void }) {
  const { control, setValue } = useFormContext<FeasibilityInputs>();
  const isPercentage = useWatch({
    control,
    name: `capitalSpread.${index}.isPercentage`,
  });

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Controller
            name={`capitalSpread.${index}.description`}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <input
                {...field}
                value={field.value ?? ""}
                type="text"
                className={cn(
                  "flex-1 rounded-lg border px-3 py-1.5 text-sm",
                  error ? "border-error focus:ring-error" : "border-gray-300"
                )}
                placeholder="Description"
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
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center">
          <Controller
            name={`capitalSpread.${index}.amount`}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label=""
                prefix={isPercentage ? "" : "$"}
                suffix={isPercentage ? "%" : ""}
                min={0}
                error={error?.message}
              />
            )}
          />
        </div>
        <Controller
          name={`capitalSpread.${index}.date`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <div className="flex flex-col gap-1">
              <input
                {...field}
                value={field.value ?? ""}
                type="text"
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm",
                  error ? "border-error focus:ring-error" : "border-gray-300"
                )}
                placeholder="Date or Month N"
              />
            </div>
          )}
        />
      </div>
      <div className="flex items-center gap-2">
        <Controller
          name={`capitalSpread.${index}.type`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <select
              {...field}
              value={field.value ?? ""}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm bg-white",
                error ? "border-error focus:ring-error" : "border-gray-300"
              )}
            >
              {SPREAD_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        />
        <Controller
          name={`capitalSpread.${index}.linkedStackCategory`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <select
              {...field}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value || undefined)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm bg-white",
                error ? "border-error focus:ring-error" : "border-gray-300"
              )}
            >
              <option value="">— Link to Stack —</option>
              {STACK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        />
        <button
          type="button"
          onClick={() => setValue(`capitalSpread.${index}.isPercentage`, !isPercentage)}
          className={`px-2 py-1.5 text-xs rounded-md border ${
            isPercentage
              ? "bg-primary text-white border-primary"
              : "bg-white text-gray-600 border-gray-300"
          }`}
        >
          %
        </button>
      </div>
    </div>
  );
}
