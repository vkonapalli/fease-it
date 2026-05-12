import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Toggle } from "~/components/ui/Toggle";
import { useFeasibilityStore } from "~/stores/feasibilityStore";
import type { GSTTreatment } from "~/types";

const GST_OPTIONS: { label: string; value: GSTTreatment }[] = [
  { label: "GST-Free (Existing Residential)", value: "gst-free" },
  { label: "Margin Scheme", value: "margin-scheme" },
  { label: "Full GST (10%)", value: "full-gst" },
  { label: "Input Taxed (Rental)", value: "input-taxed" },
  { label: "Going Concern", value: "going-concern" },
];

export function RevenueInputs() {
  const { inputs, setInputs } = useFeasibilityStore();
  const { revenue } = inputs;

  return (
    <Collapsible title="Revenue & GST">
      <div className="space-y-4">
        <Toggle
          label="GST Treatment"
          options={GST_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          value={revenue.gst.treatment}
          onChange={(value) =>
            setInputs({
              revenue: {
                ...revenue,
                gst: { ...revenue.gst, treatment: value as GSTTreatment },
              },
            })
          }
        />

        {revenue.gst.treatment === "margin-scheme" && (
          <NumberField
            label="Cost Base per Lot (for Margin Scheme)"
            value={revenue.gst.costBasePerLot ?? inputs.property.purchasePrice / inputs.development.numDwellings}
            onChange={(value) =>
              setInputs({
                revenue: {
                  ...revenue,
                  gst: { ...revenue.gst, costBasePerLot: value },
                },
              })
            }
            prefix="$"
            min={0}
          />
        )}

        <NumberField
          label="Capital Growth Rate (p.a.)"
          value={revenue.capitalGrowthRate * 100}
          onChange={(value) => setInputs({ revenue: { ...revenue, capitalGrowthRate: value / 100 } })}
          suffix="%"
          min={0}
          max={50}
          step={0.1}
        />

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Rental Assumptions (Hold Scenarios)</h4>
          <NumberField
            label="Rent per Unit / Week"
            value={revenue.rentalIncomePerUnitPerWeek}
            onChange={(value) => setInputs({ revenue: { ...revenue, rentalIncomePerUnitPerWeek: value } })}
            prefix="$"
            min={0}
          />
          <NumberField
            label="Number of Units for Rent"
            value={revenue.numUnitsForRent}
            onChange={(value) => setInputs({ revenue: { ...revenue, numUnitsForRent: value } })}
            min={0}
          />
          <NumberField
            label="Rental Growth Rate"
            value={revenue.rentalGrowthRate * 100}
            onChange={(value) => setInputs({ revenue: { ...revenue, rentalGrowthRate: value / 100 } })}
            suffix="%"
            min={0}
            max={50}
            step={0.1}
          />
          <NumberField
            label="Vacancy Rate"
            value={revenue.vacancyRate * 100}
            onChange={(value) => setInputs({ revenue: { ...revenue, vacancyRate: value / 100 } })}
            suffix="%"
            min={0}
            max={100}
            step={0.1}
          />
          <NumberField
            label="Rental Shading (Bank %)"
            value={revenue.rentalShadingPercent}
            onChange={(value) => setInputs({ revenue: { ...revenue, rentalShadingPercent: value } })}
            suffix="%"
            min={0}
            max={100}
          />
        </div>
      </div>
    </Collapsible>
  );
}
