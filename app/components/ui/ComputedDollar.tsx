import { formatCurrency } from "~/lib/utils";

interface ComputedDollarDisplayProps {
  percentage: number;
  baseAmount: number;
  label?: string;
}

/**
 * Shows "≈ $X" computed in real time next to a percentage input.
 * Style: muted text, small font, right-aligned.
 */
export function ComputedDollarDisplay({ percentage, baseAmount, label }: ComputedDollarDisplayProps) {
  if (!percentage || !baseAmount) return null;
  const computed = baseAmount * (percentage / 100);
  return (
    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
      {label ? `${label} ` : "≈ "}
      {formatCurrency(computed)}
    </span>
  );
}
