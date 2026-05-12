import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Button } from "~/components/ui/Button";
import { Toggle } from "~/components/ui/Toggle";
import { useFeasibilityStore } from "~/stores/feasibilityStore";
import { Plus, Trash2 } from "lucide-react";

export function DevelopmentInputs() {
  const { inputs, setInputs } = useFeasibilityStore();
  const { development } = inputs;

  // --- Lot management ---
  const updateLot = (id: number, updates: Partial<typeof development.lots[0]>) => {
    setInputs({
      development: {
        ...development,
        lots: development.lots.map((l) => (l.id === id ? { ...l, ...updates } : l)),
      },
    });
  };

  const addLot = () => {
    const newId = Math.max(...development.lots.map((l) => l.id), 0) + 1;
    setInputs({
      development: {
        ...development,
        numDwellings: development.numDwellings + 1,
        lots: [
          ...development.lots,
          {
            id: newId,
            name: `Block ${newId}`,
            salePrice: 1775000,
            buildAreaSqm: 0,
            landAreaSqm: 647.5,
            isHeld: false,
            hasConstruction: false,
          },
        ],
      },
    });
  };

  const removeLot = (id: number) => {
    if (development.lots.length <= 1) return;
    setInputs({
      development: {
        ...development,
        numDwellings: development.numDwellings - 1,
        lots: development.lots.filter((l) => l.id !== id),
      },
    });
  };

  // --- Global costs ---
  const updateGlobalCost = (id: string, updates: Partial<typeof development.globalCosts[0]>) => {
    setInputs({
      development: {
        ...development,
        globalCosts: development.globalCosts.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      },
    });
  };

  const addGlobalCost = () => {
    setInputs({
      development: {
        ...development,
        globalCosts: [
          ...development.globalCosts,
          {
            id: crypto.randomUUID(),
            name: "New Cost",
            amount: 0,
            isPercentage: false,
            applyPerLot: false,
          },
        ],
      },
    });
  };

  const removeGlobalCost = (id: string) => {
    setInputs({
      development: {
        ...development,
        globalCosts: development.globalCosts.filter((c) => c.id !== id),
      },
    });
  };

  return (
    <Collapsible title="Development Costs">
      <div className="space-y-6">
        {/* Lots */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Lots / Dwellings</h4>
          <div className="space-y-3">
            {development.lots.map((lot) => (
              <div key={lot.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={lot.name}
                    onChange={(e) => updateLot(lot.id, { name: e.target.value })}
                    className="font-medium text-sm bg-transparent border-none p-0 focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => removeLot(lot.id)}
                    className="text-error hover:text-error/80 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    label="Sale Price"
                    value={lot.salePrice}
                    onChange={(value) => updateLot(lot.id, { salePrice: value })}
                    prefix="$"
                    min={0}
                  />
                  <NumberField
                    label="Build Area"
                    value={lot.buildAreaSqm}
                    onChange={(value) => updateLot(lot.id, { buildAreaSqm: value })}
                    suffix="sqm"
                    min={0}
                  />
                </div>
                <div className="flex gap-2">
                  <Toggle
                    options={[
                      { label: "Sell", value: false },
                      { label: "Hold", value: true },
                    ]}
                    value={lot.isHeld}
                    onChange={(value) => updateLot(lot.id, { isHeld: value as boolean })}
                  />
                  <Toggle
                    options={[
                      { label: "No Build", value: false },
                      { label: "Build", value: true },
                    ]}
                    value={lot.hasConstruction}
                    onChange={(value) => updateLot(lot.id, { hasConstruction: value as boolean })}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={addLot} className="mt-2">
            <Plus className="h-4 w-4 mr-1" /> Add Lot
          </Button>
        </div>

        {/* Construction */}
        <NumberField
          label="Construction Cost per sqm"
          value={development.constructionCostPerSqm}
          onChange={(value) => setInputs({ development: { ...development, constructionCostPerSqm: value } })}
          prefix="$"
          min={0}
        />

        {/* Global Costs */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Global Development Costs</h4>
          <div className="space-y-2">
            {development.globalCosts.map((cost) => (
              <div key={cost.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={cost.name}
                  onChange={(e) => updateGlobalCost(cost.id, { name: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                />
                <NumberField
                  label=""
                  value={cost.amount}
                  onChange={(value) => updateGlobalCost(cost.id, { amount: value })}
                  prefix={cost.isPercentage ? "" : "$"}
                  suffix={cost.isPercentage ? "%" : ""}
                  min={0}
                />
                <button
                  type="button"
                  onClick={() => updateGlobalCost(cost.id, { isPercentage: !cost.isPercentage })}
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
                  onClick={() => updateGlobalCost(cost.id, { applyPerLot: !cost.applyPerLot })}
                  className={`px-2 py-1.5 text-xs rounded-md border ${
                    cost.applyPerLot
                      ? "bg-accent text-white border-accent"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                  title="Apply per lot"
                >
                  ×{development.numDwellings}
                </button>
                <button
                  type="button"
                  onClick={() => removeGlobalCost(cost.id)}
                  className="text-error hover:text-error/80 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={addGlobalCost} className="mt-2">
            <Plus className="h-4 w-4 mr-1" /> Add Cost
          </Button>
        </div>

        <NumberField
          label="Operating Reserve & Repairs"
          value={development.operatingReserve}
          onChange={(value) => setInputs({ development: { ...development, operatingReserve: value } })}
          prefix="$"
          min={0}
        />
        <NumberField
          label="Contingency"
          value={development.contingencyPercent}
          onChange={(value) => setInputs({ development: { ...development, contingencyPercent: value } })}
          suffix="%"
          min={0}
          max={50}
        />
      </div>
    </Collapsible>
  );
}
