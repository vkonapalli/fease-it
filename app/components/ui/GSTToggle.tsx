import { cn } from "~/lib/utils";
import type { GSTCostTreatment } from "~/types";

interface GSTToggleProps {
  value: GSTCostTreatment;
  onChange: (value: GSTCostTreatment) => void;
  size?: "sm" | "xs";
}

const OPTIONS: { value: GSTCostTreatment; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "inclusive", label: "Inc" },
  { value: "exclusive", label: "Exc" },
];

export function GSTToggle({ value, onChange, size = "xs" }: GSTToggleProps) {
  return (
    <div className={cn("inline-flex rounded-md border border-gray-200 overflow-hidden", size === "xs" ? "text-[10px]" : "text-xs")}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-1.5 py-0.5 font-medium transition-colors cursor-pointer",
            value === opt.value
              ? opt.value === "free"
                ? "bg-green-100 text-green-800"
                : opt.value === "inclusive"
                ? "bg-blue-100 text-blue-800"
                : "bg-amber-100 text-amber-800"
              : "bg-white text-gray-500 hover:bg-gray-50"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
