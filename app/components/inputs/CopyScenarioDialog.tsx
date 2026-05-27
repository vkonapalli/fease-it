import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Copy, X } from "lucide-react";

interface CopyOptions {
  copyProperty: boolean;
  copyDevelopment: boolean;
  copyFinancing: boolean;
  copyRevenue: boolean;
  copyOperating: boolean;
  copyJV: boolean;
  copyCashflow: boolean;
  copyBudget: boolean;
}

const DEFAULT_OPTIONS: CopyOptions = {
  copyProperty: true,
  copyDevelopment: true,
  copyFinancing: false,
  copyRevenue: false,
  copyOperating: false,
  copyJV: false,
  copyCashflow: false,
  copyBudget: false,
};

interface CopyScenarioDialogProps {
  sourceName: string;
  onConfirm: (name: string, options: CopyOptions) => void;
  onCancel: () => void;
}

export function CopyScenarioDialog({ sourceName, onConfirm, onCancel }: CopyScenarioDialogProps) {
  const [name, setName] = useState(`${sourceName} (Copy)`);
  const [options, setOptions] = useState<CopyOptions>(DEFAULT_OPTIONS);

  const toggle = (key: keyof CopyOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const all = Object.values(options).every(Boolean);
  const toggleAll = () => {
    const next = !all;
    setOptions({
      copyProperty: next,
      copyDevelopment: next,
      copyFinancing: next,
      copyRevenue: next,
      copyOperating: next,
      copyJV: next,
      copyCashflow: next,
      copyBudget: next,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary">Copy Scenario</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">New scenario name</label>
          <input aria-label="Input field"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            autoFocus
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Copy fields from "{sourceName}"</span>
            <button onClick={toggleAll} className="text-xs text-accent hover:underline">
              {all ? "Deselect all" : "Select all"}
            </button>
          </div>
          <div className="space-y-2">
            <Checkbox label="Property Info & Acquisition Costs" checked={options.copyProperty} onChange={() => toggle("copyProperty")} />
            <Checkbox label="Development Costs & Timeline" checked={options.copyDevelopment} onChange={() => toggle("copyDevelopment")} />
            <Checkbox label="Financing" checked={options.copyFinancing} onChange={() => toggle("copyFinancing")} />
            <Checkbox label="Revenue" checked={options.copyRevenue} onChange={() => toggle("copyRevenue")} />
            <Checkbox label="Operating Costs" checked={options.copyOperating} onChange={() => toggle("copyOperating")} />
            <Checkbox label="JV / Capital Stack" checked={options.copyJV} onChange={() => toggle("copyJV")} />
            <Checkbox label="Cashflow Phases" checked={options.copyCashflow} onChange={() => toggle("copyCashflow")} />
            <Checkbox label="Budget vs Actual" checked={options.copyBudget} onChange={() => toggle("copyBudget")} />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={() => onConfirm(name, options)} disabled={!name.trim()}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
        </div>
      </div>
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input aria-label="Input field"
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
