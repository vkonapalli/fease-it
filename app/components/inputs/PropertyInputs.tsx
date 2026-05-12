import { useMemo } from "react";
import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { useFeasibilityStore } from "~/stores/feasibilityStore";
import { calculateStampDuty, AUSTRALIAN_STATES, formatCurrency } from "~/lib/calculations/stampDuty";
import { Plus, Trash2 } from "lucide-react";

export function PropertyInputs() {
  const { inputs, setInputs } = useFeasibilityStore();
  const { property } = inputs;

  const stampDuty = useMemo(
    () => calculateStampDuty(property.location, property.purchasePrice),
    [property.location, property.purchasePrice]
  );

  // Filter out any legacy stamp-duty line items from the editable list
  const editableCosts = property.costs.filter((c) => {
    const name = c.name.toLowerCase();
    return !(name.includes("stamp") || name.includes("duty"));
  });

  const updateCost = (id: string, updates: Partial<{ name: string; amount: number; isPercentage: boolean }>) => {
    setInputs({
      property: {
        ...property,
        costs: property.costs.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      },
    });
  };

  const addCost = () => {
    setInputs({
      property: {
        ...property,
        costs: [
          ...property.costs,
          { id: crypto.randomUUID(), name: "New Cost", amount: 0, isPercentage: false },
        ],
      },
    });
  };

  const removeCost = (id: string) => {
    setInputs({
      property: {
        ...property,
        costs: property.costs.filter((c) => c.id !== id),
      },
    });
  };

  return (
    <Collapsible title="Property & Acquisition">
      <div className="space-y-4">
        {/* Address Finder */}
        <div className="space-y-3">
          <Input
            label="Street Address"
            value={property.address}
            onChange={(e) =>
              setInputs({ property: { ...property, address: e.target.value } })
            }
            placeholder="e.g. 657A Nepean Highway"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Suburb"
              value={property.suburb}
              onChange={(e) =>
                setInputs({ property: { ...property, suburb: e.target.value } })
              }
              placeholder="e.g. Frankston South"
            />
            <Input
              label="Postcode"
              value={property.postcode}
              onChange={(e) =>
                setInputs({ property: { ...property, postcode: e.target.value } })
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
                setInputs({ property: { ...property, location: e.target.value } })
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
          onChange={(value) => setInputs({ property: { ...property, purchasePrice: value } })}
          prefix="$"
          min={0}
        />
        <NumberField
          label="Total Land Area"
          value={property.landArea}
          onChange={(value) => setInputs({ property: { ...property, landArea: value } })}
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
            Calculated for {property.location} at {property.location === "VIC" ? "6.5%" : "current rates"}.
          </p>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Acquisition Costs</h4>
          <div className="space-y-2">
            {editableCosts.map((cost) => (
              <div key={cost.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={cost.name}
                  onChange={(e) => updateCost(cost.id, { name: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  placeholder="Cost name"
                />
                <NumberField
                  label=""
                  value={cost.amount}
                  onChange={(value) => updateCost(cost.id, { amount: value })}
                  prefix={cost.isPercentage ? "" : "$"}
                  suffix={cost.isPercentage ? "%" : ""}
                  min={0}
                />
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
