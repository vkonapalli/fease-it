import { useMemo } from "react";
import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { GSTToggle } from "~/components/ui/GSTToggle";
import { ComputedDollarDisplay } from "~/components/ui/ComputedDollar";
import { AddressAutocomplete } from "~/components/inputs/AddressAutocomplete";
import { useAppStore } from "~/stores/appStore";
import { useShallow } from "zustand/react/shallow";
import { calculateStampDuty, AUSTRALIAN_STATES, formatCurrency } from "~/lib/calculations/stampDuty";
import { calculateLandTax, countLandTaxPayments, calculateProjectLandTax } from "~/lib/constants/landTax";
import { Plus, Trash2, Info } from "lucide-react";

export function PropertyInputs() {
  const property = useAppStore(useShallow((s) => s.getActiveScenario()!.inputs.property));
  const development = useAppStore(useShallow((s) => s.getActiveScenario()!.inputs.development));
  const updateActiveInputs = useAppStore((s) => s.updateActiveInputs);

  const stampDuty = useMemo(
    () => calculateStampDuty(property!.location, property!.purchasePrice),
    [property!.location, property!.purchasePrice]
  );

  // Fallback: if landValue is missing/NaN/0, use purchasePrice (matching calc engine)
  const effectiveLandValue = property!.landValue || property!.purchasePrice || 0;

  const landTaxAnnual = useMemo(() => {
    if (!property!.location || !effectiveLandValue) return 0;
    return calculateLandTax(property!.location, effectiveLandValue, false);
  }, [property!.location, effectiveLandValue]);

  const timelineMonths = development?.timeline?.timelineMonths ?? 12;
  const settlementDate = development?.timeline?.settlementDate;
  const contractDate = development?.timeline?.contractDate;
  const landTaxPayments = countLandTaxPayments(settlementDate ?? "", contractDate ?? "", timelineMonths);
  const landTaxTotal = landTaxAnnual * landTaxPayments;

  // Filter out any legacy stamp-duty or land-tax line items from the editable list
  const editableCosts = property.costs.filter((c) => {
    const name = c.name.toLowerCase();
    return !(name.includes("stamp") || name.includes("duty") || name.includes("land tax"));
  });

  const updateCost = (id: string, updates: Partial<{ name: string; amount: number; isPercentage: boolean; gstTreatment: "free" | "inclusive" | "exclusive" }>) => {
    updateActiveInputs({
      property: {
        ...property,
        costs: property.costs.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      },
    });
  };

  const addCost = () => {
    updateActiveInputs({
      property: {
        ...property,
        costs: [
          ...property.costs,
          { id: crypto.randomUUID(), name: "New Cost", amount: 0, isPercentage: false, gstTreatment: "inclusive" },
        ],
      },
    });
  };

  const removeCost = (id: string) => {
    updateActiveInputs({
      property: {
        ...property,
        costs: property.costs.filter((c) => c.id !== id),
      },
    });
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
    updateActiveInputs({
      property: {
        ...property,
        address: parsed.formattedAddress,
        suburb: parsed.suburb,
        postcode: parsed.postcode,
        location: parsed.state,
      },
    });
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
            <Input
              value={property.address}
              onChange={(e) =>
                updateActiveInputs({ property: { ...property, address: e.target.value } })
              }
              placeholder="e.g. 123 High Street"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Suburb"
              value={property.suburb}
              onChange={(e) =>
                updateActiveInputs({ property: { ...property, suburb: e.target.value } })
              }
              placeholder="e.g. Frankston South"
            />
            <Input
              label="Postcode"
              value={property.postcode}
              onChange={(e) =>
                updateActiveInputs({ property: { ...property, postcode: e.target.value } })
              }
              placeholder="e.g. 3199"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <select
              value={property.location}
              onChange={(e) =>
                updateActiveInputs({ property: { ...property, location: e.target.value } })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {AUSTRALIAN_STATES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <NumberField
          label="Purchase Price"
          value={property.purchasePrice}
          onChange={(value) => updateActiveInputs({ property: { ...property, purchasePrice: value } })}
          prefix="$"
          min={0}
        />

        {/* Land Value with tooltip */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <NumberField
              label="Unimproved Land Value"
              value={property.landValue}
              onChange={(value) => updateActiveInputs({ property: { ...property, landValue: value } })}
              prefix="$"
              min={0}
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

        <NumberField
          label="Total Land Area"
          value={property.landArea}
          onChange={(value) => updateActiveInputs({ property: { ...property, landArea: value } })}
          suffix="sqm"
          min={0}
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
          <input
            type="checkbox"
            id="land-tax-auto"
            checked={property.landTaxAuto}
            onChange={(e) => updateActiveInputs({ property: { ...property, landTaxAuto: e.target.checked } })}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-accent"
          />
          <label htmlFor="land-tax-auto" className="text-sm text-gray-700">
            Auto-calculate land tax from {property.location} rates
          </label>
        </div>

        {!property.landTaxAuto && (
          <NumberField
            label="Custom Annual Land Tax"
            value={property.landTaxOverride ?? 0}
            onChange={(value) => updateActiveInputs({ property: { ...property, landTaxOverride: value } })}
            prefix="$"
            min={0}
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
            {editableCosts.map((cost) => (
              <div key={cost.id} className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  value={cost.name}
                  onChange={(e) => updateCost(cost.id, { name: e.target.value })}
                  className="flex-1 min-w-[120px] rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  placeholder="Cost name"
                />
                <div className="flex items-center">
                  <NumberField
                    label=""
                    value={cost.amount}
                    onChange={(value) => updateCost(cost.id, { amount: value })}
                    prefix={cost.isPercentage ? "" : "$"}
                    suffix={cost.isPercentage ? "%" : ""}
                    min={0}
                  />
                  {cost.isPercentage && (
                    <ComputedDollarDisplay
                      percentage={cost.amount}
                      baseAmount={property.purchasePrice}
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => updateCost(cost.id, { isPercentage: !cost.isPercentage })}
                  className={`px-2 py-1.5 text-xs rounded-md border ${
                    cost.isPercentage
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  %
                </button>
                <GSTToggle
                  value={cost.gstTreatment}
                  onChange={(value) => updateCost(cost.id, { gstTreatment: value })}
                />
                <button
                  type="button"
                  onClick={() => removeCost(cost.id)}
                  className="text-error hover:text-error/80 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={addCost} className="mt-2">
            <Plus className="h-4 w-4 mr-1" /> Add Cost
          </Button>
        </div>
      </div>
    </Collapsible>
  );
}
