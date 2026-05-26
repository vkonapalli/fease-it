import { cn } from "~/lib/utils";

interface ToggleProps {
  options: { label: string; value: string | number | boolean }[];
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
  label?: string;
  error?: string;
}

export function Toggle({ options, value, onChange, label, error }: ToggleProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className={cn(
        "inline-flex rounded-lg bg-gray-100 p-1",
        error && "ring-1 ring-error"
      )}>
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
              value === option.value
                ? "bg-white text-primary shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
