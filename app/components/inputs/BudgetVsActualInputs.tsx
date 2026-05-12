import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Button } from "~/components/ui/Button";
import { useFeasibilityStore } from "~/stores/feasibilityStore";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "~/lib/utils";

export function BudgetVsActualInputs() {
  const { inputs, setInputs } = useFeasibilityStore();
  const { budgetVsActual } = inputs;

  const updateItem = (id: string, updates: Partial<typeof budgetVsActual.items[0]>) => {
    const newItems = budgetVsActual.items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    const totalBudget = newItems.reduce((sum, i) => sum + i.budget, 0);
    const totalActual = newItems.reduce((sum, i) => sum + i.actual, 0);
    setInputs({
      budgetVsActual: {
        items: newItems,
        totalBudget,
        totalActual,
        totalVariance: totalActual - totalBudget,
      },
    });
  };

  const addItem = () => {
    const newItems = [
      ...budgetVsActual.items,
      { id: crypto.randomUUID(), category: "New Item", budget: 0, actual: 0, variance: 0, variancePercent: 0 },
    ];
    const totalBudget = newItems.reduce((sum, i) => sum + i.budget, 0);
    const totalActual = newItems.reduce((sum, i) => sum + i.actual, 0);
    setInputs({
      budgetVsActual: {
        items: newItems,
        totalBudget,
        totalActual,
        totalVariance: totalActual - totalBudget,
      },
    });
  };

  const removeItem = (id: string) => {
    const newItems = budgetVsActual.items.filter((i) => i.id !== id);
    const totalBudget = newItems.reduce((sum, i) => sum + i.budget, 0);
    const totalActual = newItems.reduce((sum, i) => sum + i.actual, 0);
    setInputs({
      budgetVsActual: {
        items: newItems,
        totalBudget,
        totalActual,
        totalVariance: totalActual - totalBudget,
      },
    });
  };

  return (
    <Collapsible title="Budget vs Actual">
      <div className="space-y-3">
        {/* Header row - hidden on mobile */}
        <div className="hidden sm:grid sm:grid-cols-[1fr,110px,110px,110px,70px,32px] gap-2 items-center text-xs font-medium text-gray-500">
          <div>Category</div>
          <div className="text-right">Budget</div>
          <div className="text-right">Actual</div>
          <div className="text-right">Variance</div>
          <div className="text-right">%</div>
          <div></div>
        </div>

        {budgetVsActual.items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-1 sm:grid-cols-[1fr,110px,110px,110px,70px,32px] gap-2 items-start sm:items-center bg-gray-50 sm:bg-transparent rounded-lg p-3 sm:p-0"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={item.category}
                onChange={(e) => updateItem(item.id, { category: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
              <span className="sm:hidden text-xs text-gray-500">Budget</span>
              <NumberField
                label=""
                value={item.budget}
                onChange={(value) => updateItem(item.id, { budget: value })}
                prefix="$"
                min={0}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
              <span className="sm:hidden text-xs text-gray-500">Actual</span>
              <NumberField
                label=""
                value={item.actual}
                onChange={(value) => updateItem(item.id, { actual: value })}
                prefix="$"
                min={0}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 items-center">
              <span className="sm:hidden text-xs text-gray-500">Variance</span>
              <div className={`text-sm font-mono text-right ${item.actual - item.budget >= 0 ? "text-success" : "text-error"}`}>
                {formatCurrency(item.actual - item.budget)}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 items-center">
              <span className="sm:hidden text-xs text-gray-500">%</span>
              <div className="text-xs font-mono text-right text-gray-500">
                {item.budget > 0 ? `${((item.actual - item.budget) / item.budget * 100).toFixed(1)}%` : "—"}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-error hover:text-error/80 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,110px,110px,110px,70px,32px] gap-2 items-center border-t border-gray-200 pt-2 mt-2 font-semibold">
          <div className="text-sm">Total</div>
          <div className="hidden sm:block text-sm font-mono text-right">{formatCurrency(budgetVsActual.totalBudget)}</div>
          <div className="hidden sm:block text-sm font-mono text-right">{formatCurrency(budgetVsActual.totalActual)}</div>
          <div className={`hidden sm:block text-sm font-mono text-right ${budgetVsActual.totalVariance >= 0 ? "text-success" : "text-error"}`}>
            {formatCurrency(budgetVsActual.totalVariance)}
          </div>
          <div className="hidden sm:block"></div>
          <div className="hidden sm:block"></div>
          {/* Mobile total summary */}
          <div className="sm:hidden col-span-full text-sm space-y-1 bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between"><span className="text-gray-500">Budget:</span><span className="font-mono">{formatCurrency(budgetVsActual.totalBudget)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Actual:</span><span className="font-mono">{formatCurrency(budgetVsActual.totalActual)}</span></div>
            <div className={`flex justify-between ${budgetVsActual.totalVariance >= 0 ? "text-success" : "text-error"}`}>
              <span>Variance:</span><span className="font-mono">{formatCurrency(budgetVsActual.totalVariance)}</span>
            </div>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>
    </Collapsible>
  );
}
