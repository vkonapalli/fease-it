import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Button } from "~/components/ui/Button";
import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import type { FeasibilityInputs } from "@fease-it/schemas";
import { asMoney, asPercentage, asNat, asPositiveInt } from "@fease-it/schemas";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";

export function JVInputs() {
  const { control, watch, setValue } = useFormContext<FeasibilityInputs>();
  const jv = watch("jv");

  const { fields: roundFields, append: appendRound } = useFieldArray({
    control,
    name: "jv.rounds",
  });

  const { fields: partnerFields, append: appendPartner, remove: removePartner } = useFieldArray({
    control,
    name: "jv.moneyPartners",
  });

  return (
    <Collapsible title="JV / Capital Stack">
      <div className="space-y-4">
        <Controller
          name="jv.developerEquity"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <NumberField
              {...field}
              label="Developer Equity"
              prefix="$"
              min={0}
              error={error?.message}
            />
          )}
        />
        <div className="grid grid-cols-2 gap-2">
          <Controller
            name="jv.investorProfitSharePercent"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Investor Profit Share"
                suffix="%"
                min={0}
                max={100}
                error={error?.message}
              />
            )}
          />
          <Controller
            name="jv.developerProfitSharePercent"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Developer Profit Share"
                suffix="%"
                min={0}
                max={100}
                error={error?.message}
              />
            )}
          />
        </div>

        {/* Capital Rounds */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Capital Rounds</h4>
          {roundFields.map((round, rIndex) => (
            <div key={round.id} className="border border-gray-200 rounded-lg p-3 mb-2 space-y-2">
              <Controller
                name={`jv.rounds.${rIndex}.name`}
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <input aria-label="Input field"                     {...field}
                    type="text"
                    className={cn(
                      "font-medium text-sm bg-transparent border-none p-0 focus:ring-0 w-full",
                      error ? "text-error placeholder:text-error/50" : ""
                    )}
                  />
                )}
              />
              {jv.rounds[rIndex].investors.map((inv, iIndex) => (
                <div key={inv.id ?? `inv-${rIndex}-${iIndex}`} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Controller
                      name={`jv.rounds.${rIndex}.investors.${iIndex}.name`}
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <input aria-label="Input field"                           {...field}
                          type="text"
                          className={cn(
                            "flex-1 rounded-lg border px-3 py-1.5 text-sm",
                            error ? "border-error focus:ring-error" : "border-gray-300"
                          )}
                        />
                      )}
                    />
                    <Controller
                      name={`jv.rounds.${rIndex}.investors.${iIndex}.amount`}
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <NumberField
                          {...field}
                          label=""
                          onChange={(val) => {
                            field.onChange(val);
                            // Recalculate totalRaised for the round
                            const currentInvestors = [...jv.rounds[rIndex].investors];
                            currentInvestors[iIndex].amount = asMoney(val);
                            const newTotal = asMoney(currentInvestors.reduce((s, i) => s + i.amount, 0));
                            setValue(`jv.rounds.${rIndex}.totalRaised`, asMoney(newTotal));
                          }}
                          prefix="$"
                          min={0}
                          error={error?.message}
                        />
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newInvestors = jv.rounds[rIndex].investors.filter((_, i) => i !== iIndex);
                        setValue(`jv.rounds.${rIndex}.investors`, newInvestors);
                        setValue(`jv.rounds.${rIndex}.totalRaised`, asMoney(newInvestors.reduce((s, i) => s + i.amount, 0)));
                      }}
                      aria-label="Delete item" className="text-error hover:text-error/80 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  const newInv = { id: crypto.randomUUID(), name: "New Investor", amount: asMoney(0) };
                  setValue(`jv.rounds.${rIndex}.investors`, [...jv.rounds[rIndex].investors, newInv]);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Investor
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => appendRound({
            id: crypto.randomUUID(),
            name: `Round ${roundFields.length + 1}`,
            totalRaised: asMoney(0),
            investors: [],
          })}>
            <Plus className="h-4 w-4 mr-1" /> Round
          </Button>
        </div>

        {/* Money Partners */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Money Partners (Debt)</h4>
          {partnerFields.map((mp, index) => (
            <div key={mp.id} className="flex flex-col gap-1 mb-2">
              <div className="flex items-center gap-2">
                <Controller
                  name={`jv.moneyPartners.${index}.name`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <input aria-label="Input field"                       {...field}
                      type="text"
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-1.5 text-sm",
                        error ? "border-error focus:ring-error" : "border-gray-300"
                      )}
                    />
                  )}
                />
                <Controller
                  name={`jv.moneyPartners.${index}.amount`}
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
                  name={`jv.moneyPartners.${index}.interestRate`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <NumberField
                      {...field}
                      label=""
                      suffix="%"
                      min={0}
                      max={100}
                      error={error?.message}
                    />
                  )}
                />
                <Controller
                  name={`jv.moneyPartners.${index}.monthsLoaned`}
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <NumberField
                      {...field}
                      label=""
                      suffix="mo"
                      min={1}
                      error={error?.message}
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => removePartner(index)}
                  aria-label="Delete item" className="text-error hover:text-error/80 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => appendPartner({ 
            id: crypto.randomUUID(), 
            name: "New Partner", 
            amount: asMoney(0), 
            interestRate: asPercentage(15), 
            monthsLoaned: asPositiveInt(12)
          })}>
            <Plus className="h-4 w-4 mr-1" /> Partner
          </Button>
        </div>
      </div>
    </Collapsible>
  );
}
