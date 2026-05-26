import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { useFormContext, Controller } from "react-hook-form";
import { useMemo } from "react";
import { cn } from "~/lib/utils";
import type { FeasibilityInputs } from "~/types";
import { calculateLandTax, countLandTaxPayments } from "~/lib/constants/landTax";
import { formatCurrency } from "~/lib/calculations/stampDuty";
import { Info } from "lucide-react";

export function TimelineInputs() {
  const { control, watch } = useFormContext<FeasibilityInputs>();
  
  const timeline = watch("development.timeline");
  const property = watch("property");

  // Fallback: if landValue is missing/NaN/0, use purchasePrice (matching calc engine)
  const effectiveLandValue = property.landValue || property.purchasePrice || 0;

  // Auto-calculate land tax
  const annualLandTax = useMemo(() => {
    if (!property.location || !effectiveLandValue) return 0;
    return calculateLandTax(property.location, effectiveLandValue, false);
  }, [property.location, effectiveLandValue]);

  const landTaxPayments = countLandTaxPayments(timeline.settlementDate, timeline.contractDate, timeline.timelineMonths);

  const totalLandTax = useMemo(() => {
    return annualLandTax * landTaxPayments;
  }, [annualLandTax, landTaxPayments]);

  // Validation: contract date cannot be later than settlement date
  const contractAfterSettlement = timeline.contractDate && timeline.settlementDate
    ? new Date(timeline.contractDate) > new Date(timeline.settlementDate)
    : false;

  return (
    <Collapsible title="Project Timeline">
      <div className="space-y-4">
        {contractAfterSettlement && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            Contract date cannot be later than settlement date.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Settlement Date</label>
            <Controller
              name="development.timeline.settlementDate"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <input
                    {...field}
                    type="date"
                    className={cn(
                      "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
                      error && "border-error focus:border-error focus:ring-error"
                    )}
                  />
                  {error && <p className="text-xs text-error mt-1">{error.message}</p>}
                </>
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract Date</label>
            <Controller
              name="development.timeline.contractDate"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <input
                    {...field}
                    type="date"
                    className={cn(
                      "w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-accent",
                      (error || contractAfterSettlement)
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-accent"
                    )}
                  />
                  {error && <p className="text-xs text-error mt-1">{error.message}</p>}
                </>
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Controller
            name="development.timeline.timelineMonths"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberField
                {...field}
                label="Project Duration (months)"
                suffix="months"
                min={1}
                max={120}
                error={error?.message}
              />
            )}
          />
          <div className="group relative pt-5">
            <Info className="h-4 w-4 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
              Project duration is measured from the contract date. For example, a 12-month project starting 1 Jan 2024 ends 31 Dec 2024.
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800" />
            </div>
          </div>
        </div>

        {/* Land Tax Preview */}
        {annualLandTax > 0 && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">Estimated Land Tax</span>
              <span className="text-sm font-semibold text-blue-900">
                {formatCurrency(totalLandTax)}
              </span>
            </div>
            <p className="text-xs text-blue-700">
              {formatCurrency(annualLandTax)} / year × {landTaxPayments} payment{landTaxPayments !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-blue-600">
              Based on {property.location} rates for land value of {formatCurrency(effectiveLandValue)}.
              {(!property.landValue && property.purchasePrice > 0) && " (fallback: using purchase price)"}
            </p>
          </div>
        )}
      </div>
    </Collapsible>
  );
}
