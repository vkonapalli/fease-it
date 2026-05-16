import { Collapsible } from "~/components/ui/Collapsible";
import { NumberField } from "~/components/ui/NumberField";
import { Button } from "~/components/ui/Button";
import { Toggle } from "~/components/ui/Toggle";
import { useInputSlice } from "~/stores/feasibilityStore";
import { Plus, Trash2 } from "lucide-react";
import type { CashflowFrequency } from "~/types";

const FREQ_OPTIONS: { label: string; value: CashflowFrequency }[] = [
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Annual", value: "annual" },
];

export function CashflowInputs() {
  const [cashflow, setCashflow] = useInputSlice("cashflow");

  const updatePhase = (id: string, updates: Partial<typeof cashflow.phases[0]>) => {
    setCashflow({
      phases: cashflow.phases.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
  };

  const addPhase = () => {
    setCashflow({
      phases: [
        ...cashflow.phases,
        {
          id: crypto.randomUUID(),
          name: `Phase ${cashflow.phases.length + 1}`,
          months: 1,
          costs: [],
          income: [],
        },
      ],
    });
  };

  const removePhase = (id: string) => {
    setCashflow({
      phases: cashflow.phases.filter((p) => p.id !== id),
    });
  };

  const addLineItem = (phaseId: string, type: "costs" | "income") => {
    setCashflow({
      phases: cashflow.phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              [type]: [...p[type], { name: "New Item", amount: 0, frequency: "once" as const }],
            }
          : p
      ),
    });
  };

  const updateLineItem = (
    phaseId: string,
    type: "costs" | "income",
    index: number,
    updates: Partial<{ name: string; amount: number; frequency: "once" | "monthly" }>
  ) => {
    setCashflow({
      phases: cashflow.phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              [type]: p[type].map((item, i) => (i === index ? { ...item, ...updates } : item)),
            }
          : p
      ),
    });
  };

  const removeLineItem = (phaseId: string, type: "costs" | "income", index: number) => {
    setCashflow({
      phases: cashflow.phases.map((p) =>
        p.id === phaseId ? { ...p, [type]: p[type].filter((_, i) => i !== index) } : p
      ),
    });
  };

  return (
    <Collapsible title="Cashflow Configuration">
      <div className="space-y-4">
        <Toggle
          label="Frequency"
          options={FREQ_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          value={cashflow.frequency}
          onChange={(value) =>
            setCashflow({ frequency: value as CashflowFrequency })
          }
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={cashflow.startDate}
            onChange={(e) => setCashflow({ startDate: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {cashflow.phases.map((phase) => (
          <div key={phase.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={phase.name}
                onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                className="font-medium text-sm bg-transparent border-none p-0 focus:ring-0"
              />
              <button
                type="button"
                onClick={() => removePhase(phase.id)}
                className="text-error hover:text-error/80 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <NumberField
              label="Duration (months)"
              value={phase.months}
              onChange={(value) => updatePhase(phase.id, { months: value })}
              suffix="months"
              min={1}
            />

            {/* Income */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-success">Income</p>
              {phase.income.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateLineItem(phase.id, "income", idx, { name: e.target.value })}
                    className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs"
                  />
                  <NumberField
                    label=""
                    value={item.amount}
                    onChange={(value) => updateLineItem(phase.id, "income", idx, { amount: value })}
                    prefix="$"
                    min={0}
                  />
                  <select
                    value={item.frequency}
                    onChange={(e) =>
                      updateLineItem(phase.id, "income", idx, { frequency: e.target.value as "once" | "monthly" })
                    }
                    className="rounded border border-gray-200 px-2 py-1 text-xs"
                  >
                    <option value="once">Once</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeLineItem(phase.id, "income", idx)}
                    className="text-error p-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => addLineItem(phase.id, "income")}>
                <Plus className="h-3 w-3 mr-1" /> Income
              </Button>
            </div>

            {/* Costs */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-error">Costs</p>
              {phase.costs.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateLineItem(phase.id, "costs", idx, { name: e.target.value })}
                    className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs"
                  />
                  <NumberField
                    label=""
                    value={item.amount}
                    onChange={(value) => updateLineItem(phase.id, "costs", idx, { amount: value })}
                    prefix="$"
                    min={0}
                  />
                  <select
                    value={item.frequency}
                    onChange={(e) =>
                      updateLineItem(phase.id, "costs", idx, { frequency: e.target.value as "once" | "monthly" })
                    }
                    className="rounded border border-gray-200 px-2 py-1 text-xs"
                  >
                    <option value="once">Once</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeLineItem(phase.id, "costs", idx)}
                    className="text-error p-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => addLineItem(phase.id, "costs")}>
                <Plus className="h-3 w-3 mr-1" /> Cost
              </Button>
            </div>
          </div>
        ))}

        <Button variant="ghost" size="sm" onClick={addPhase}>
          <Plus className="h-4 w-4 mr-1" /> Phase
        </Button>
      </div>
    </Collapsible>
  );
}
