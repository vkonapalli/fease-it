import { useState, useCallback, useMemo } from "react";
import { z } from "zod";
import { Input } from "./Input";
import { formatCurrency } from "~/lib/utils";

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

function buildParser(prefix?: string, min?: number, max?: number) {
  let num = z.number();
  if (min !== undefined) num = num.min(min);
  if (max !== undefined) num = num.max(max);

  return z
    .string()
    .transform((val) => {
      const cleaned = prefix === "$" ? val.replace(/[$,]/g, "") : val.replace(/,/g, "");
      const parsed = parseFloat(cleaned);
      return Number.isFinite(parsed) ? parsed : 0;
    })
    .pipe(num);
}

const displayValueSchema = z.number().nullish();

function toDisplay(value: number, prefix?: string): string {
  const parsed = displayValueSchema.safeParse(value);
  if (!parsed.success || parsed.data == null) return "";

  if (prefix === "$") {
    return formatCurrency(parsed.data);
  }
  return parsed.data.toString();
}

function toEdit(value: number, prefix?: string): string {
  const parsed = displayValueSchema.safeParse(value);
  if (!parsed.success || parsed.data == null) return "";

  if (prefix === "$") {
    return Math.round(parsed.data).toString();
  }
  return parsed.data.toString();
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
}: NumberFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string | null>(null);

  const displayValue = isEditing && editValue !== null ? editValue : toDisplay(value, prefix);

  const parser = useMemo(() => buildParser(prefix, min, max), [prefix, min, max]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setEditValue(raw);

      const result = parser.safeParse(raw);
      onChange(result.success ? result.data : 0);
    },
    [parser, onChange]
  );

  const handleFocus = useCallback(() => {
    setIsEditing(true);
    setEditValue(toEdit(value, prefix));
  }, [value, prefix]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    setEditValue(null);
  }, []);

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
