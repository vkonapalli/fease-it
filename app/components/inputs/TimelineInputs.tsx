import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { useFeasibilityStore } from "~/stores/feasibilityStore";
import { useMemo } from "react";
import { calculateLandTax } from "~/lib/constants/landTax";
import { formatCurrency } from "~/lib/calculations/stampDuty";

export function TimelineInputs() {
  const { inputs, setInputs } = useFeasibilityStore();
  const { development, property } = inputs;
  const timeline = development.timeline;

  // Auto-calculate land tax
  const annualLandTax = useMemo(() => {
    if (!property.location || !property.purchasePrice) return 0;
    return calculateLandTax(property.location, property.purchasePrice, false);
  }, [property.location, property.purchasePrice]);

  const totalLandTax = useMemo(() => {
    return annualLandTax * (timeline.timelineMonths / 12);
  }, [annualLandTax, timeline.timelineMonths]);

  const updateTimeline = (updates: Partial<typeof timeline>) => {
    setInputs({
      development: {
        ...development,
        timeline: { ...timeline, ...updates },
      },
    });
  };

  return (
    <Collapsible title="Project Timeline">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Settlement Date</label>
            <input
              type="date"
              value={timeline.settlementDate}
              onChange={(e) => updateTimeline({ settlementDate: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract Date</label>
            <input
              type="date"
              value={timeline.contractDate}
              onChange={(e) => updateTimeline({ contractDate: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <NumberField
          label="Project Duration (months)"
          value={timeline.timelineMonths}
          onChange={(value) => updateTimeline({ timelineMonths: value })}
          suffix="months"
          min={1}
          max={120}
        />

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
              {formatCurrency(annualLandTax)} / year × {timeline.timelineMonths} months
            </p>
            <p className="text-xs text-blue-600">
              Based on {property.location} rates for land value of {formatCurrency(property.purchasePrice)}.
            </p>
          </div>
        )}
      </div>
    </Collapsible>
  );
}
