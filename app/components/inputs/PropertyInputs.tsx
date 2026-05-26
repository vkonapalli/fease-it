import { useMemo } from "react";
import { cn } from "~/lib/utils";
import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { GSTToggle } from "~/components/ui/GSTToggle";
import { ComputedDollarDisplay } from "~/components/ui/ComputedDollar";
import { AddressAutocomplete } from "~/components/inputs/AddressAutocomplete";
import { useFormContext, Controller, useFieldArray } from "react-hook-form";
import type { FeasibilityInputs } from "~/types";
import { calculateStampDuty, AUSTRALIAN_STATES, formatCurrency } from "~/lib/calculations/stampDuty";
import { calculateLandTax, countLandTaxPayments } from "~/lib/constants/landTax";
import { Plus, Trash2, Info } from "lucide-react";

export function PropertyInputs() {
  const { control, watch, setValue } = useFormContext<FeasibilityInputs>();
  
  // Watch necessary fields for derivations
  const property = watch("property");
  const development = watch("development");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "property.costs",
  });

  const stampDuty = useMemo(
    () => calculateStampDuty(property.location, property.purchasePrice),
    [property.location, property.purchasePrice]
  );

  // Fallback: if landValue is missing/NaN/0, use purchasePrice (matching calc engine)
  const effectiveLandValue = property.landValue || property.purchasePrice || 0;

  const landTaxAnnual = useMemo(() => {
    if (!property.location || !effectiveLandValue) return 0;
    return calculateLandTax(property.location, effectiveLandValue, false);
  }, [property.location, effectiveLandValue]);

  const timelineMonths = development?.timeline?.timelineMonths ?? 12;
  const settlementDate = development?.timeline?.settlementDate;
  const contractDate = development?.timeline?.contractDate;
  const landTaxPayments = countLandTaxPayments(settlementDate ?? "", contractDate ?? "", timelineMonths);
  const landTaxTotal = landTaxAnnual * landTaxPayments;

  // Filter out any legacy stamp-duty or land-tax line items from the editable list
  // Note: with FieldArray, we use the fields directly. 
  // We'll just hide them in the render loop if they match.
  const isLegacyCost = (name: string) => {
    const n = name.toLowerCase();
    return n.includes("stamp") || n.includes("duty") || n.includes("land tax");
  };

  const handleAddressSelect = (parsed: {
    formattedAddress: string;
    streetNumber: string;
    street: string;
    suburb: string;
    state: string;
    postcode: string;
    country: string;
  }) => {
    setValue("property.address", parsed.formattedAddress);
    setValue("property.suburb", parsed.suburb);
    setValue("property.postcode", parsed.postcode);
    setValue("property.location", parsed.state);
  };

  return (
    <Collapsible title="Property & Acquisition">
      <div className="space-y-4">
        {/* Address Finder */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Address</label>
          {import.meta.env.VITE_ENABLE_GOOGLE_PLACES === "true" ? (
            <AddressAutocomplete
              value={property.address}
              onSelect={handleAddressSelect}
              placeholder="Start typing address..."
            />
          ) : (
            <Controller
              name="property.address"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Input
                  {...field}
                  placeholder="e.g. 123 High Street"
                  error={error?.message}
                />
              )}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="property.suburb"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Input
                  {...field}
                  label="Suburb"
                  placeholder="e.g. Frankston South"
                  error={error?.message}
                />
              )}
            />
            <Controller
              name="property.postcode"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Input
                  {...field}
                  label="Postcode"
                  placeholder="e.g. 3199"
                  error={error?.message}
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <Controller
              name="property.location"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <select
                    {...field}
                    className={cn(
                      "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
                      error && "border-error focus:border-error focus:ring-error"
                    )}
                  >
                    {AUSTRALIAN_STATES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  {error && <p className="text-xs text-error mt-1">{error.message}</p>}
                </>
              )}
            />
          </div>
        </div>

        <Controller
          name="property.purchasePrice"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <NumberField
              {...field}
              label="Purchase Price"
              prefix="$"
              min={0}
              error={error?.message}
            />
          )}
        />

        {/* Land Value with tooltip */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Controller
              name="property.landValue"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <NumberField
                  {...field}
                  label="Unimproved Land Value"
                  prefix="$"
                  min={0}
                  error={error?.message}
                />
              )}
            />
            <div className="group relative">
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                Site value used for land tax calculations. Often less than the full purchase price (which includes improvements).
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800" />
              </div>
            </div>
          </div>
        </div>

        <Controller
          name="property.landArea"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <NumberField
              {...field}
              label="Total Land Area"
              suffix="sqm"
              min={0}
              error={error?.message}
            />
          )}
        />

        {/* Auto-calculated Stamp Duty */}
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Stamp Duty (auto)</span>
            <span className="text-sm font-semibold text-primary">{formatCurrency(stampDuty)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Calculated for {property.location} at investment property rates.
          </p>
        </div>

        {/* Land Tax Toggle */}
        <div className="flex items-center gap-2">
          <Controller
            name="property.landTaxAuto"
            control={control}
            render={({ field }) => (
              <input
                type="checkbox"
                id="land-tax-auto"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-accent"
              />
            )}
          />
          <label htmlFor="land-tax-auto" className="text-sm text-gray-700">
            Auto-calculate land tax from {property.location} rates
          </label>
        </div>

        {!property.landTaxAuto && (
          <Controller
            name="property.landTaxOverride"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Custom Annual Land Tax"
                value={field.value ?? 0}
                prefix="$"
                min={0}
                error={error?.message}
              />
            )}
          />
        )}

        {/* Auto-calculated Land Tax */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Estimated Land Tax</span>
            <span className="text-sm font-semibold text-blue-900">{formatCurrency(landTaxTotal)}</span>
          </div>
          <p className="text-xs text-blue-700">
            {formatCurrency(landTaxAnnual)} / year × {landTaxPayments} payment{landTaxPayments !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-blue-600">
            Based on {property.location} rates for land value of {formatCurrency(effectiveLandValue)}.
            {(!property.landValue && property.purchasePrice > 0) && " (fallback: using purchase price)"}
          </p>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Acquisition Costs</h4>
          <div className="space-y-2">
            {fields.map((cost, index) => {
              if (isLegacyCost(cost.name)) return null;
              return (
                <div key={cost.id} className="flex items-center gap-2 flex-wrap">
                  <Controller
                    name={`property.costs.${index}.name`}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <div className="flex-1 min-w-[120px]">
                        <input
                          {...field}
                          type="text"
                          className={cn(
                            "w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm",
                            error && "border-error focus:border-error focus:ring-error"
                          )}
                          placeholder="Cost name"
                        />
                        {error && <p className="text-[10px] text-error mt-0.5">{error.message}</p>}
                      </div>
                    )}
                  />
                  <div className="flex items-center">
                    <Controller
                      name={`property.costs.${index}.amount`}
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <NumberField
                          {...field}
                          label=""
                          prefix={property.costs[index].isPercentage ? "" : "$"}
                          suffix={property.costs[index].isPercentage ? "%" : ""}
                          min={0}
                          error={error?.message}
                        />
                      )}
                    />
                    {property.costs[index].isPercentage && (
                      <ComputedDollarDisplay
                        percentage={property.costs[index].amount}
                        baseAmount={property.purchasePrice}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue(`property.costs.${index}.isPercentage`, !property.costs[index].isPercentage)}
                    className={`px-2 py-1.5 text-xs rounded-md border ${
                      property.costs[index].isPercentage
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-600 border-gray-300"
                    }`}
                  >
                    %
                  </button>
                  <Controller
                    name={`property.costs.${index}.gstTreatment`}
                    control={control}
                    render={({ field }) => (
                      <GSTToggle
                        {...field}
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
              );
            })}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => append({ id: crypto.randomUUID(), name: "New Cost", amount: 0, isPercentage: false, gstTreatment: "inclusive" })} 
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Cost
          </Button>
        </div>
      </div>
    </Collapsible>
  );
}
