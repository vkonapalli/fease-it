import { Collapsible } from "~/components/ui/Collapsible";
import { Toggle } from "~/components/ui/Toggle";
import { NumberField } from "~/components/ui/NumberField";
import { Button } from "~/components/ui/Button";
import { useInputSlice } from "~/stores/feasibilityStore";
import { Plus, Trash2 } from "lucide-react";

const STRATEGY_OPTIONS = [
  { label: "Sub-division", value: "sub-division" },
  { label: "Townhouse", value: "townhouse" },
  { label: "Apartments", value: "apartments" },
  { label: "Single House", value: "single-house" },
];

const PRICING_OPTIONS = [
  { label: "Average Price / Lot", value: "average" },
  { label: "Individual Price", value: "individual" },
  { label: "Group by Lot Size", value: "group-size" },
  { label: "Income / sqm", value: "per-sqm" },
];

export function DevelopmentStrategyInputs() {
  const [development, setDevelopment] = useInputSlice("development");
  const strategy = development.strategy;

  const updateStrategy = (updates: Partial<typeof strategy>) => {
    setDevelopment({
      strategy: { ...strategy, ...updates },
    });
  };

  const addGroup = () => {
    updateStrategy({
      lotSizeGroups: [
        ...strategy.lotSizeGroups,
        {
          id: crypto.randomUUID(),
          name: `Group ${strategy.lotSizeGroups.length + 1}`,
          minSqm: 0,
          maxSqm: 0,
          pricePerLot: 0,
        },
      ],
    });
  };

  const updateGroup = (id: string, updates: Partial<typeof strategy.lotSizeGroups[0]>) => {
    updateStrategy({
      lotSizeGroups: strategy.lotSizeGroups.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    });
  };

  const removeGroup = (id: string) => {
    updateStrategy({
      lotSizeGroups: strategy.lotSizeGroups.filter((g) => g.id !== id),
    });
  };

  return (
    <Collapsible title="Development Strategy" defaultOpen>
      <div className="space-y-4">
        <Toggle
          label="Strategy Type"
          options={STRATEGY_OPTIONS}
          value={strategy.strategyType}
          onChange={(value) => updateStrategy({ strategyType: value as typeof strategy.strategyType })}
        />

        <Toggle
          label="Pricing Model"
          options={PRICING_OPTIONS}
          value={strategy.pricingModel}
          onChange={(value) => updateStrategy({ pricingModel: value as typeof strategy.pricingModel })}
        />

        {strategy.pricingModel === "average" && (
          <NumberField
            label="Average Sale Price per Lot"
            value={strategy.averagePricePerLot}
            onChange={(value) => updateStrategy({ averagePricePerLot: value })}
            prefix="$"
            min={0}
          />
        )}

        {strategy.pricingModel === "per-sqm" && (
          <NumberField
            label="Price per sqm"
            value={strategy.pricePerSqm}
            onChange={(value) => updateStrategy({ pricePerSqm: value })}
            prefix="$"
            suffix="/sqm"
            min={0}
          />
        )}

        {strategy.pricingModel === "group-size" && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Lot Size Groups</div>
            {strategy.lotSizeGroups.map((group) => (
              <div key={group.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={group.name}
                  onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                  className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  placeholder="Name"
                />
                <NumberField
                  label=""
                  value={group.minSqm}
                  onChange={(value) => updateGroup(group.id, { minSqm: value })}
                  suffix="sqm"
                  min={0}
                  placeholder="Min"
                />
                <span className="text-gray-400">-</span>
                <NumberField
                  label=""
                  value={group.maxSqm}
                  onChange={(value) => updateGroup(group.id, { maxSqm: value })}
                  suffix="sqm"
                  min={0}
                  placeholder="Max"
                />
                <NumberField
                  label=""
                  value={group.pricePerLot}
                  onChange={(value) => updateGroup(group.id, { pricePerLot: value })}
                  prefix="$"
                  min={0}
                  placeholder="Price"
                />
                <button
                  type="button"
                  onClick={() => removeGroup(group.id)}
                  className="text-error hover:text-error/80 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addGroup}>
              <Plus className="h-4 w-4 mr-1" /> Add Group
            </Button>
          </div>
        )}

        {/* Stress Test */}
        <div className="border-t border-gray-200 pt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Stress Test (Lot Count)</div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Minimum Lots"
              value={strategy.minLots ?? 0}
              onChange={(value) => updateStrategy({ minLots: value > 0 ? value : null })}
              min={0}
            />
            <NumberField
              label="Maximum Lots"
              value={strategy.maxLots ?? 0}
              onChange={(value) => updateStrategy({ maxLots: value > 0 ? value : null })}
              min={0}
            />
          </div>
        </div>
      </div>
    </Collapsible>
  );
}
