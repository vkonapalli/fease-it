import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Button } from "~/components/ui/Button";
import { useFeasibilityStore } from "~/stores/feasibilityStore";
import { Plus, Trash2 } from "lucide-react";

export function OperatingInputs() {
  const { inputs, setInputs } = useFeasibilityStore();
  const { operating } = inputs;

  const updateCost = (id: string, updates: Partial<typeof operating.costs[0]>) => {
    setInputs({
      operating: {
        ...operating,
        costs: operating.costs.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      },
    });
  };

  const addCost = () => {
    setInputs({
      operating: {
        ...operating,
        costs: [
          ...operating.costs,
          {
            id: crypto.randomUUID(),
            name: "New Operating Cost",
            annualAmount: 0,
            isPercentageOfRent: false,
            escalationRate: 0,
          },
        ],
      },
    });
  };

  const removeCost = (id: string) => {
    setInputs({
      operating: {
        ...operating,
        costs: operating.costs.filter((c) => c.id !== id),
      },
    });
  };

  return (
    <Collapsible title="Operating Costs (Hold)">
      <div className="space-y-4">
        <NumberField
          label="Hold Period (Years)"
          value={operating.holdPeriodYears}
          onChange={(value) => setInputs({ operating: { ...operating, holdPeriodYears: value } })}
          suffix="years"
          min={1}
          max={50}
        />

        <div className="space-y-2">
          {operating.costs.map((cost) => (
            <div key={cost.id} className="flex items-center gap-2">
              <input
                type="text"
                value={cost.name}
                onChange={(e) => updateCost(cost.id, { name: e.target.value })}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
              <NumberField
                label=""
                value={cost.annualAmount}
                onChange={(value) => updateCost(cost.id, { annualAmount: value })}
                prefix={cost.isPercentageOfRent ? "" : "$"}
                suffix={cost.isPercentageOfRent ? "% of rent" : "/yr"}
                min={0}
              />
              <button
                type="button"
                onClick={() => updateCost(cost.id, { isPercentageOfRent: !cost.isPercentageOfRent })}
                className={`px-2 py-1.5 text-xs rounded-md border ${
                  cost.isPercentageOfRent
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                %
              </button>
              <NumberField
                label=""
                value={cost.escalationRate * 100}
                onChange={(value) => updateCost(cost.id, { escalationRate: value / 100 })}
                suffix="% esc"
                min={0}
                max={50}
                step={0.1}
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
        <Button variant="ghost" size="sm" onClick={addCost}>
          <Plus className="h-4 w-4 mr-1" /> Add Cost
        </Button>
      </div>
    </Collapsible>
  );
}
