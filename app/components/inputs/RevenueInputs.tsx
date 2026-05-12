import { useMemo } from "react";
import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Toggle } from "~/components/ui/Toggle";
import { ComputedDollarDisplay } from "~/components/ui/ComputedDollar";
import { useFeasibilityStore } from "~/stores/feasibilityStore";
import type { GSTTreatment } from "~/types";

const GST_OPTIONS: { label: string; value: GSTTreatment }[] = [
  { label: "GST-Free (Existing Residential)", value: "gst-free" },
  { label: "Full GST (10%)", value: "full-gst" },
  { label: "Input Taxed (Rental)", value: "input-taxed" },
  { label: "Going Concern", value: "going-concern" },
];

export function RevenueInputs() {
  const { inputs, setInputs } = useFeasibilityStore();
  const { revenue, property, development } = inputs;

  const totalRevenue = useMemo(() => {
    switch (development.strategy.pricingModel) {
      case "average":
        return development.strategy.averagePricePerLot * development.numDwellings;
      case "individual":
        return development.lots.reduce((sum, l) => sum + l.salePrice, 0);
      case "per-sqm":
        return development.lots.reduce((sum, l) => sum + development.strategy.pricePerSqm * l.landAreaSqm, 0);
      case "group-size":
        return development.lots.reduce((sum, l) => {
          const group = development.strategy.lotSizeGroups.find(
            (g) => l.landAreaSqm >= g.minSqm && l.landAreaSqm <= g.maxSqm
          );
          return sum + (group?.pricePerLot ?? l.salePrice);
        }, 0);
      default:
        return development.lots.reduce((sum, l) => sum + l.salePrice, 0);
    }
  }, [development]);

  return (
    <Collapsible title="Revenue & GST">
      <div className="space-y-4">
        {/* Margin Scheme Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Apply Margin Scheme</span>
          <Toggle
            options={[
              { label: "Off", value: false },
              { label: "On", value: true },
            ]}
            value={revenue.applyMarginScheme}
            onChange={(value) =>
              setInputs({
                revenue: {
                  ...revenue,
                  applyMarginScheme: value as boolean,
                },
              })
            }
          />
        </div>

        {revenue.applyMarginScheme && (
          <NumberField
            label="Cost Base per Lot (for Margin Scheme)"
            value={revenue.gst.costBasePerLot ?? property.purchasePrice / development.numDwellings}
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

        {!revenue.applyMarginScheme && (
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

        {/* Sales Commission */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Sales Commission</h4>
          <Toggle
            options={[
              { label: "% Based", value: "percentage" },
              { label: "Flat Fee", value: "flat" },
            ]}
            value={revenue.salesCommissionType}
            onChange={(value) =>
              setInputs({
                revenue: {
                  ...revenue,
                  salesCommissionType: value as "percentage" | "flat",
                },
              })
            }
          />
          {revenue.salesCommissionType === "percentage" ? (
            <div className="flex items-center mt-2">
              <NumberField
                label="Commission %"
                value={revenue.salesCommissionPercent}
                onChange={(value) => setInputs({ revenue: { ...revenue, salesCommissionPercent: value } })}
                suffix="%"
                min={0}
                max={100}
                step={0.1}
              />
              <ComputedDollarDisplay
                percentage={revenue.salesCommissionPercent}
                baseAmount={totalRevenue}
                label="≈"
              />
            </div>
          ) : (
            <div className="mt-2">
              <NumberField
                label="Flat Fee"
                value={revenue.salesCommissionFlat}
                onChange={(value) => setInputs({ revenue: { ...revenue, salesCommissionFlat: value } })}
                prefix="$"
                min={0}
              />
            </div>
          )}
        </div>

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
