import { Input } from "./Input";
import { useState, useEffect } from "react";
import { formatCurrency, parseCurrency } from "~/lib/utils";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  error,
  min,
  max,
  step = 1,
}: NumberFieldProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isEditing) return;
    if (prefix === "$") {
      setDisplayValue(value ? formatCurrency(value) : "");
    } else if (suffix === "%") {
      // For percentages, show with decimals
      setDisplayValue(value !== undefined && value !== null ? value.toString() : "");
    } else {
      setDisplayValue(value !== undefined && value !== null ? value.toString() : "");
    }
  }, [value, prefix, suffix, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    let numValue: number;

    if (prefix === "$") {
      numValue = parseCurrency(raw);
    } else {
      // Strip commas for numeric parsing
      numValue = parseFloat(raw.replace(/,/g, "")) || 0;
    }

    if (min !== undefined && numValue < min) numValue = min;
    if (max !== undefined && numValue > max) numValue = max;

    setDisplayValue(raw);
    onChange(numValue);
  };

  const handleFocus = () => {
    setIsEditing(true);
    // Show raw value for editing
    if (prefix === "$") {
      setDisplayValue(value ? Math.round(value).toString() : "");
    } else {
      setDisplayValue(value !== undefined && value !== null ? value.toString() : "");
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (prefix === "$") {
      setDisplayValue(value ? formatCurrency(value) : "");
    } else if (suffix === "%") {
      setDisplayValue(value !== undefined && value !== null ? value.toString() : "");
    } else {
      setDisplayValue(value !== undefined && value !== null ? value.toString() : "");
    }
  };

  return (
    <Input
      type="text"
      label={label}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      prefix={prefix}
      suffix={suffix}
      placeholder={placeholder}
      error={error}
    />
  );
}
