import { useState } from "react";
import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Button } from "~/components/ui/Button";
import { useInputSlice } from "~/stores/feasibilityStore";
import { Plus, Trash2 } from "lucide-react";

const SPREAD_TYPE_OPTIONS = [
  { label: "Deposit", value: "Deposit" },
  { label: "Progress", value: "Progress" },
  { label: "Final", value: "Final" },
];

const STACK_CATEGORIES = [
  "Senior Debt",
  "Mezzanine Debt",
  "Private Lending",
  "Profit Sharing",
  "Developer Equity",
  "Other Equity",
];

export function CapitalSpreadInputs() {
  const [capitalSpread, setCapitalSpread] = useInputSlice("capitalSpread");

  const addItem = () => {
    setCapitalSpread([
      ...capitalSpread,
      {
        id: crypto.randomUUID(),
        description: "New Spread Item",
        amount: 0,
        isPercentage: false,
        date: "",
        type: "Deposit",
      },
    ]);
  };

  const updateItem = (id: string, updates: Partial<(typeof capitalSpread)[0]>) => {
    setCapitalSpread(
      capitalSpread.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCapitalSpread(
      capitalSpread.filter((item) => item.id !== id)
    );
  };

  return (
    <Collapsible title="Capital Spread Schedule">
      <div className="space-y-3">
        {capitalSpread.length === 0 && (
          <p className="text-sm text-gray-500">No capital spread items yet.</p>
        )}
        {capitalSpread.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                placeholder="Description"
              />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-error hover:text-error/80 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <NumberField
                  label=""
                  value={item.amount}
                  onChange={(value) => updateItem(item.id, { amount: value })}
                  prefix={item.isPercentage ? "" : "$"}
                  suffix={item.isPercentage ? "%" : ""}
                  min={0}
                />
              </div>
              <input
                type="text"
                value={item.date}
                onChange={(e) => updateItem(item.id, { date: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                placeholder="Date or Month N"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={item.type}
                onChange={(e) => updateItem(item.id, { type: e.target.value as "Deposit" | "Progress" | "Final" })}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              >
                {SPREAD_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={item.linkedStackCategory ?? ""}
                onChange={(e) => updateItem(item.id, { linkedStackCategory: e.target.value || undefined })}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              >
                <option value="">— Link to Stack —</option>
                {STACK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => updateItem(item.id, { isPercentage: !item.isPercentage })}
                className={`px-2 py-1.5 text-xs rounded-md border ${
                  item.isPercentage
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                %
              </button>
            </div>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1" /> Add Spread Item
        </Button>
      </div>
    </Collapsible>
  );
}
