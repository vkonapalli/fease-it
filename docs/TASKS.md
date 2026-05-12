# Fease-it: Task List

## Batch 1: Project Foundation

### Task 1.1: Initialize Next.js Project

```
Priority: P0
Estimated Time: 30 minutes
Prerequisites: Node.js 18+, npm/yarn
```

**Commands:**

```bash
cd /Users/venky/dev/fease-it
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
# Select defaults for all prompts
```

**Verification:**

- [ ] Project starts without errors
- [ ] <http://localhost:3000> shows default Next.js page
- [ ] TypeScript compiles without errors

---

### Task 1.2: Install Dependencies

```
Priority: P0
Estimated Time: 15 minutes
```

**Commands:**

```bash
npm install zustand recharts react-hook-form zod @hookform/resolvers clsx tailwind-merge lucide-react
npm install -D @types/node
```

**Verification:**

- [ ] No peer dependency warnings
- [ ] Can import all packages in code

---

### Task 1.3: Configure Tailwind

```
Priority: P0
Estimated Time: 15 minutes
```

**Update `tailwind.config.ts`:**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1E3A5F",
        secondary: "#64748B",
        accent: "#00B8A9",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
```

**Update `globals.css`:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

---

### Task 1.4: Create Type Definitions

```
Priority: P0
Estimated Time: 45 minutes
```

**Create `src/types/index.ts`:**

```typescript
export interface PropertyInputs {
  purchasePrice: number;
  landArea: number;
  location: string;
}

export interface DevelopmentInputs {
  numDwellings: number;
  constructionCostPerSqm: number;
  demolitionCost: number;
  townPlanningPercent: number;
  buildingPermitsPercent: number;
  utilitiesCost: number;
  holdingCostPercent: number;
  contingencyPercent: number;
  marketingCostPercent: number;
}

export interface FinancingInputs {
  lvr: 70 | 80;
  interestRate: number;
  loanTermMonths: number;
  establishmentFeePercent: number;
  brokerFeePercent: number;
  settlementFee: number;
}

export interface RevenueInputs {
  salePricePerDwelling: number;
  useMarginScheme: boolean;
}

export interface FeasibilityInputs {
  property: PropertyInputs;
  development: DevelopmentInputs;
  financing: FinancingInputs;
  revenue: RevenueInputs;
}

export interface CashflowRow {
  month: Date;
  income: number;
  expenses: number;
  netCashflow: number;
  cumulativeCashflow: number;
}

export interface SensitivityRow {
  label: string;
  profit: number;
  margin: number;
}

export interface ComparisonRow {
  lvr: number;
  loan: number;
  cashRequired: number;
  monthlyPayment: number;
  profitAfterInterest: number;
}

export interface FeasibilityResults {
  totalRevenue: number;
  gstAmount: number;
  totalCosts: number;
  profit: number;
  profitMargin: number;
  loanAmount: number;
  cashRequired: number;
  monthlyInterestPayment: number;
  comparison: ComparisonRow[];
  cashflow: CashflowRow[];
  sensitivity: SensitivityRow[];
}

export interface Feasibility {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  inputs: FeasibilityInputs;
  results: FeasibilityResults;
}
```

**Verification:**

- [ ] TypeScript compiles without errors
- [ ] All interfaces can be imported

---

## Batch 2: Core UI Components

### Task 2.1: Utility Functions

```
Priority: P0
Estimated Time: 20 minutes
```

**Create `src/lib/utils.ts`:**

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[$,]/g, "")) || 0;
}
```

---

### Task 2.2: Button Component

```
Priority: P0
Estimated Time: 15 minutes
```

**Create `src/components/ui/Button.tsx`:**

```typescript
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50",
          {
            "bg-primary text-white hover:bg-primary/90": variant === "primary",
            "bg-secondary text-white hover:bg-secondary/90": variant === "secondary",
            "bg-transparent hover:bg-gray-100": variant === "ghost",
          },
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-base": size === "md",
            "px-6 py-3 text-lg": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
```

---

### Task 2.3: Input Components

```
Priority: P0
Estimated Time: 30 minutes
```

**Create `src/components/ui/Input.tsx`:**

```typescript
import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, prefix, suffix, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-gray-100",
              error && "border-error focus:border-error focus:ring-error",
              prefix && "pl-7",
              suffix && "pr-12",
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
```

---

### Task 2.4: Card Component

```
Priority: P0
Estimated Time: 15 minutes
```

**Create `src/components/ui/Card.tsx`:**

```typescript
import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "highlighted";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl bg-white p-4 shadow-sm",
          variant === "highlighted" && "border-2 border-accent",
          className
        )}
        {...props}
      />
    );
  }
);

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("mb-4", className)} {...props} />;
  }
);

CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h3 ref={ref} className={cn("text-lg font-semibold text-primary", className)} {...props} />
    );
  }
);

CardTitle.displayName = "CardTitle";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("", className)} {...props} />;
  }
);

CardContent.displayName = "CardContent";
```

---

### Task 2.5: Collapsible Section

```
Priority: P0
Estimated Time: 20 minutes
```

**Create `src/components/ui/Collapsible.tsx`:**

```typescript
"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState, HTMLAttributes } from "react";

interface CollapsibleProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  defaultOpen?: boolean;
}

export function Collapsible({ title, defaultOpen = true, className, children, ...props }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("border border-gray-200 rounded-lg", className)} {...props}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-medium text-primary hover:bg-gray-50"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn("h-5 w-5 text-gray-500 transition-transform", isOpen && "rotate-180")}
        />
      </button>
      {isOpen && <div className="border-t border-gray-200 p-4">{children}</div>}
    </div>
  );
}
```

---

### Task 2.6: Toggle Component

```
Priority: P1
Estimated Time: 15 minutes
```

**Create `src/components/ui/Toggle.tsx`:**

```typescript
import { cn } from "@/lib/utils";

interface ToggleProps {
  options: { label: string; value: string | number }[];
  value: string | number;
  onChange: (value: string | number) => void;
  label?: string;
}

export function Toggle({ options, value, onChange, label }: ToggleProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="inline-flex rounded-lg bg-gray-100 p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              value === option.value
                ? "bg-white text-primary shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

### Task 2.7: NumberField Component

```
Priority: P0
Estimated Time: 20 minutes
```

**Create `src/components/ui/NumberField.tsx`:**

```typescript
import { Input } from "./Input";
import { useState, useEffect } from "react";
import { formatCurrency, parseCurrency } from "@/lib/utils";

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

  useEffect(() => {
    if (prefix === "$") {
      setDisplayValue(value ? formatCurrency(value) : "");
    } else {
      setDisplayValue(value ? value.toString() : "");
    }
  }, [value, prefix]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    let numValue: number;

    if (prefix === "$") {
      numValue = parseCurrency(raw);
    } else {
      numValue = parseFloat(raw.replace(/,/g, "")) || 0;
    }

    if (min !== undefined && numValue < min) numValue = min;
    if (max !== undefined && numValue > max) numValue = max;

    setDisplayValue(raw);
    onChange(numValue);
  };

  const handleBlur = () => {
    if (prefix === "$") {
      setDisplayValue(value ? formatCurrency(value) : "");
    } else {
      setDisplayValue(value ? value.toString() : "");
    }
  };

  return (
    <Input
      type="text"
      label={label}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      prefix={prefix}
      suffix={suffix}
      placeholder={placeholder}
      error={error}
    />
  );
}
```

---

## Batch 3: State Management

### Task 3.1: Zustand Store

```
Priority: P0
Estimated Time: 45 minutes
```

**Create `src/stores/feasibilityStore.ts`:**

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FeasibilityInputs, FeasibilityResults } from "@/types";

interface FeasibilityState {
  // Current inputs
  inputs: FeasibilityInputs;

  // Computed results
  results: FeasibilityResults | null;

  // Actions
  setInputs: (inputs: Partial<FeasibilityInputs>) => void;
  setResults: (results: FeasibilityResults) => void;
  resetInputs: () => void;

  // Save/Load
  saveFeasibility: (name: string) => void;
  loadFeasibility: (id: string) => void;
  savedFeasibilities: { id: string; name: string; date: Date }[];
}

const DEFAULT_INPUTS: FeasibilityInputs = {
  property: {
    purchasePrice: 2760000,
    landArea: 1295,
    location: "VIC",
  },
  development: {
    numDwellings: 2,
    constructionCostPerSqm: 2430,
    demolitionCost: 60000,
    townPlanningPercent: 0.6,
    buildingPermitsPercent: 0.6,
    utilitiesCost: 50000,
    holdingCostPercent: 0.5,
    contingencyPercent: 2,
    marketingCostPercent: 1.5,
  },
  financing: {
    lvr: 80,
    interestRate: 6,
    loanTermMonths: 12,
    establishmentFeePercent: 0.5,
    brokerFeePercent: 0.55,
    settlementFee: 500,
  },
  revenue: {
    salePricePerDwelling: 1775000,
    useMarginScheme: true,
  },
};

export const useFeasibilityStore = create<FeasibilityState>()(
  persist(
    (set, get) => ({
      inputs: DEFAULT_INPUTS,
      results: null,
      savedFeasibilities: [],

      setInputs: (newInputs) =>
        set((state) => ({
          inputs: {
            ...state.inputs,
            ...newInputs,
          },
        })),

      setResults: (results) => set({ results }),

      resetInputs: () => set({ inputs: DEFAULT_INPUTS, results: null }),

      saveFeasibility: (name) => {
        const { inputs, results, savedFeasibilities } = get();
        const id = crypto.randomUUID();
        const newFeasibility = { id, name, date: new Date() };

        set({
          savedFeasibilities: [...savedFeasibilities, newFeasibility],
        });

        localStorage.setItem(`feasibility-${id}`, JSON.stringify({ inputs, results, name }));
      },

      loadFeasibility: (id) => {
        const saved = localStorage.getItem(`feasibility-${id}`);
        if (saved) {
          const { inputs, results } = JSON.parse(saved);
          set({ inputs, results });
        }
      },
    }),
    {
      name: "fease-it-storage",
      partialize: (state) => ({
        inputs: state.inputs,
        savedFeasibilities: state.savedFeasibilities,
      }),
    }
  )
);
```

---

## Batch 4: Calculation Engine

### Task 4.1: GST Calculations

```
Priority: P0
Estimated Time: 30 minutes
```

**Create `src/lib/calculations/gst.ts`:**

```typescript
/**
 * Australian GST Margin Scheme Calculation
 *
 * The margin scheme calculates GST on the difference between
 * the sale price and the cost base (in this case, purchase price / number of lots)
 *
 * NOT simply 10% of the sale price
 */
export function calculateGSTMarginScheme(
  salePricePerLot: number,
  purchasePrice: number,
  numLots: number
): number {
  // Cost base per lot
  const costBasePerLot = purchasePrice / numLots;

  // Margin = Sale price - Cost base
  const margin = salePricePerLot - costBasePerLot;

  // GST is 10% of the margin (only if positive)
  return Math.max(0, margin * 0.1);
}

/**
 * Standard GST calculation (for comparison)
 */
export function calculateStandardGST(salePrice: number): number {
  return salePrice * 0.1;
}
```

---

### Task 4.2: Financing Calculations

```
Priority: P0
Estimated Time: 30 minutes
```

**Create `src/lib/calculations/financing.ts`:**

```typescript
export interface LoanCalculation {
  loanAmount: number;
  cashRequired: number;
  monthlyPayment: number;
  establishmentFee: number;
  brokerFee: number;
  settlementFee: number;
  totalFees: number;
}

export function calculateLoan({
  propertyValue,
  lvr,
  interestRate,
  loanTermMonths,
  establishmentFeePercent,
  brokerFeePercent,
  settlementFee,
  acquisitionCosts,
  developmentCosts,
  marketingCosts,
}: {
  propertyValue: number;
  lvr: number;
  interestRate: number;
  loanTermMonths: number;
  establishmentFeePercent: number;
  brokerFeePercent: number;
  settlementFee: number;
  acquisitionCosts: number;
  developmentCosts: number;
  marketingCosts: number;
}): LoanCalculation {
  // Loan amount based on LVR
  const loanAmount = propertyValue * (lvr / 100);

  // Fees
  const establishmentFee = loanAmount * (establishmentFeePercent / 100);
  const brokerFee = loanAmount * (brokerFeePercent / 100);
  const totalFees = establishmentFee + brokerFee + settlementFee;

  // Total costs
  const totalCosts = acquisitionCosts + developmentCosts + marketingCosts + totalFees;

  // Cash required (what's not covered by loan)
  const cashRequired = totalCosts - loanAmount + (propertyValue - loanAmount);

  // Monthly interest-only payment
  const monthlyPayment = (loanAmount * (interestRate / 100)) / 12;

  return {
    loanAmount,
    cashRequired: Math.max(0, cashRequired),
    monthlyPayment,
    establishmentFee,
    brokerFee,
    settlementFee,
    totalFees,
  };
}

/**
 * Compare two LVR scenarios
 */
export function compareLVRScenarios(
  propertyValue: number,
  scenarios: { lvr: number; interestRate: number }[],
  totalCosts: number
): {
  lvr: number;
  loan: number;
  cashRequired: number;
  monthlyPayment: number;
}[] {
  return scenarios.map(({ lvr, interestRate }) => {
    const loan = propertyValue * (lvr / 100);
    const cashRequired = Math.max(0, totalCosts - loan + (propertyValue - loan));
    const monthlyPayment = (loan * (interestRate / 100)) / 12;

    return {
      lvr,
      loan,
      cashRequired,
      monthlyPayment,
    };
  });
}
```

---

### Task 4.3: Profit Calculations

```
Priority: P0
Estimated Time: 30 minutes
```

**Create `src/lib/calculations/profit.ts`:**

```typescript
export interface ProfitBreakdown {
  totalRevenue: number;
  totalCosts: number;
  profit: number;
  profitMargin: number;
  costBreakdown: {
    acquisition: number;
    construction: number;
    development: number;
    financing: number;
    marketing: number;
    holding: number;
  };
}

export function calculateProfit({
  // Revenue
  salePricePerLot,
  numLots,
  useMarginScheme,
  purchasePrice,
  // Costs
  constructionCostPerSqm,
  landArea,
  demolitionCost,
  townPlanningPercent,
  buildingPermitsPercent,
  utilitiesCost,
  holdingCostPercent,
  contingencyPercent,
  marketingCostPercent,
  // Financing
  loanAmount,
  interestCost,
  establishmentFee,
  brokerFee,
  settlementFee,
  // Acquisition
  stampDutyRate,
  buyersFee,
  dueDiligence,
  legalCosts,
}: {
  // Revenue
  salePricePerLot: number;
  numLots: number;
  useMarginScheme: boolean;
  purchasePrice: number;
  // Costs
  constructionCostPerSqm: number;
  landArea: number;
  demolitionCost: number;
  townPlanningPercent: number;
  buildingPermitsPercent: number;
  utilitiesCost: number;
  holdingCostPercent: number;
  contingencyPercent: number;
  marketingCostPercent: number;
  // Financing
  loanAmount: number;
  interestCost: number;
  establishmentFee: number;
  brokerFee: number;
  settlementFee: number;
  // Acquisition
  stampDutyRate: number;
  buyersFee: number;
  dueDiligence: number;
  legalCosts: number;
}): ProfitBreakdown {
  // Calculate revenue
  const grossRevenue = salePricePerLot * numLots;

  // GST calculation
  let gstAmount = 0;
  if (useMarginScheme) {
    const marginPerLot = salePricePerLot - (purchasePrice / numLots);
    gstAmount = Math.max(0, marginPerLot * 0.1) * numLots;
  } else {
    gstAmount = grossRevenue * 0.1;
  }

  const totalRevenue = grossRevenue; // GST is collected but not added to revenue

  // Calculate costs
  // Acquisition costs
  const stampDuty = (purchasePrice + buyersFee) * (stampDutyRate / 100);
  const acquisitionTotal = purchasePrice + stampDuty + buyersFee + dueDiligence + legalCosts;

  // Construction
  const constructionTotal = constructionCostPerSqm * landArea;

  // Development costs (percentage-based)
  const developmentTotal =
    constructionTotal +
    (totalRevenue * (townPlanningPercent / 100)) +
    (totalRevenue * (buildingPermitsPercent / 100)) +
    demolitionCost +
    utilitiesCost +
    (totalRevenue * (holdingCostPercent / 100)) +
    (totalRevenue * (contingencyPercent / 100));

  // Marketing
  const marketingTotal = (totalRevenue * (marketingCostPercent / 100)) + 10000; // +10k base

  // Financing costs
  const financingTotal = interestCost + establishmentFee + brokerFee + settlementFee;

  const totalCosts =
    acquisitionTotal + developmentTotal + financingTotal + marketingTotal;

  // Calculate profit
  const profit = totalRevenue - totalCosts;
  const profitMargin = totalCosts > 0 ? (profit / totalCosts) * 100 : 0;

  return {
    totalRevenue,
    totalCosts,
    profit,
    profitMargin,
    costBreakdown: {
      acquisition: acquisitionTotal,
      construction: constructionTotal,
      development: developmentTotal,
      financing: financingTotal,
      marketing: marketingTotal,
      holding: totalRevenue * (holdingCostPercent / 100),
    },
  };
}
```

---

### Task 4.4: Cashflow Generation

```
Priority: P1
Estimated Time: 45 minutes
```

**Create `src/lib/calculations/cashflow.ts`:**

```typescript
import { CashflowRow } from "@/types";

export function generateCashflow({
  startDate,
  durationMonths,
  acquisitionPhase,
  developmentPhase,
  salesPhase,
  financingCosts,
}: {
  startDate: Date;
  durationMonths: number;
  acquisitionPhase: { months: number; costs: number[] };
  developmentPhase: { months: number; monthlyCost: number };
  salesPhase: { months: number; saleMonth: number; saleRevenue: number };
  financingCosts: { monthlyInterest: number; establishmentFee: number };
}): CashflowRow[] {
  const rows: CashflowRow[] = [];
  let cumulative = 0;

  for (let month = 0; month < durationMonths; month++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + month);

    let income = 0;
    let expenses = 0;

    // Acquisition phase
    if (month < acquisitionPhase.months) {
      expenses += acquisitionPhase.costs[month] || 0;
    }

    // Development phase
    if (month >= acquisitionPhase.months && month < acquisitionPhase.months + developmentPhase.months) {
      expenses += developmentPhase.monthlyCost;
    }

    // Financing costs
    expenses += financingCosts.monthlyInterest;

    // Sales phase
    if (month === saleMonth) {
      income += saleRevenue;
    }

    const netCashflow = income - expenses;
    cumulative += netCashflow;

    rows.push({
      month: date,
      income,
      expenses,
      netCashflow,
      cumulativeCashflow: cumulative,
    });
  }

  return rows;
}
```

---

### Task 4.5: Sensitivity Analysis

```
Priority: P1
Estimated Time: 30 minutes
```

**Create `src/lib/calculations/sensitivity.ts`:**

```typescript
import { SensitivityRow } from "@/types";
import { calculateProfit } from "./profit";

export function calculateSensitivity(
  baseInputs: Parameters<typeof calculateProfit>[0],
  variations: {
    variable: keyof typeof baseInputs;
    changes: number[];
  }[]
): SensitivityRow[] {
  const results: SensitivityRow[] = [];

  for (const { variable, changes } of variations) {
    for (const change of changes) {
      const modifiedInputs = {
        ...baseInputs,
        [variable]: (baseInputs[variable] as number) * (1 + change / 100),
      };

      const result = calculateProfit(modifiedInputs);

      results.push({
        label: `${variable} ${change > 0 ? "+" : ""}${change}%`,
        profit: result.profit,
        margin: result.profitMargin,
      });
    }
  }

  return results;
}

/**
 * Standard sensitivity variations
 */
export const DEFAULT_SENSITIVITY_VARIATIONS = {
  salePricePerLot: [-20, -10, 10, 20],
  constructionCostPerSqm: [-20, -10, 10, 20],
  interestRate: [-1, 1, 2],
  holdingCostPercent: [-0.5, 0.5],
};
```

---

### Task 4.6: Main Calculator

```
Priority: P0
Estimated Time: 45 minutes
```

**Create `src/lib/calculations/index.ts`:**

```typescript
import { FeasibilityInputs, FeasibilityResults, ComparisonRow } from "@/types";
import { calculateLoan } from "./financing";
import { calculateProfit } from "./profit";
import { calculateSensitivity, DEFAULT_SENSITIVITY_VARIATIONS } from "./sensitivity";

export function calculateFeasibility(inputs: FeasibilityInputs): FeasibilityResults {
  const {
    property: { purchasePrice, landArea },
    development: {
      numDwellings,
      constructionCostPerSqm,
      demolitionCost,
      townPlanningPercent,
      buildingPermitsPercent,
      utilitiesCost,
      holdingCostPercent,
      contingencyPercent,
      marketingCostPercent,
    },
    financing: { lvr, interestRate, loanTermMonths, establishmentFeePercent, brokerFeePercent, settlementFee },
    revenue: { salePricePerDwelling, useMarginScheme },
  } = inputs;

  // Calculate loan
  const propertyValue = purchasePrice;
  const stampDutyRate = 6; // VIC default
  const buyersFee = 40000;
  const dueDiligence = 15000;
  const legalCosts = 3000;

  const loanCalc = calculateLoan({
    propertyValue,
    lvr,
    interestRate,
    loanTermMonths,
    establishmentFeePercent,
    brokerFeePercent,
    settlementFee,
    acquisitionCosts: purchasePrice + (purchasePrice * stampDutyRate / 100) + buyersFee + dueDiligence + legalCosts,
    developmentCosts: 0, // calculated in profit
    marketingCosts: 0,
  });

  // Calculate profit
  const profitResult = calculateProfit({
    salePricePerLot: salePricePerDwelling,
    numLots: numDwellings,
    useMarginScheme,
    purchasePrice,
    constructionCostPerSqm,
    landArea,
    demolitionCost,
    townPlanningPercent,
    buildingPermitsPercent,
    utilitiesCost,
    holdingCostPercent,
    contingencyPercent,
    marketingCostPercent,
    loanAmount: loanCalc.loanAmount,
    interestCost: loanCalc.monthlyPayment * loanTermMonths,
    establishmentFee: loanCalc.establishmentFee,
    brokerFee: loanCalc.brokerFee,
    settlementFee: loanCalc.settlementFee,
    stampDutyRate,
    buyersFee,
    dueDiligence,
    legalCosts,
  });

  // Compare scenarios
  const comparison: ComparisonRow[] = [70, 80].map((lvrOption) => {
    const calc = calculateLoan({
      propertyValue,
      lvr: lvrOption,
      interestRate,
      loanTermMonths,
      establishmentFeePercent,
      brokerFeePercent,
      settlementFee,
      acquisitionCosts: purchasePrice + (purchasePrice * stampDutyRate / 100) + buyersFee + dueDiligence + legalCosts,
      developmentCosts: 0,
      marketingCosts: 0,
    });

    const profitAfterInterest = profitResult.totalRevenue - profitResult.totalCosts + (loanCalc.loanAmount - calc.loanAmount);

    return {
      lvr: lvrOption,
      loan: calc.loanAmount,
      cashRequired: calc.cashRequired,
      monthlyPayment: calc.monthlyPayment,
      profitAfterInterest: profitAfterInterest > 0 ? profitAfterInterest : 0,
    };
  });

  // Sensitivity analysis
  const sensitivity = calculateSensitivity(
    {
      salePricePerLot: salePricePerDwelling,
      numLots: numDwellings,
      useMarginScheme,
      purchasePrice,
      constructionCostPerSqm,
      landArea,
      demolitionCost,
      townPlanningPercent,
      buildingPermitsPercent,
      utilitiesCost,
      holdingCostPercent,
      contingencyPercent,
      marketingCostPercent,
      loanAmount: loanCalc.loanAmount,
      interestCost: loanCalc.monthlyPayment * loanTermMonths,
      establishmentFee: loanCalc.establishmentFee,
      brokerFee: loanCalc.brokerFee,
      settlementFee: loanCalc.settlementFee,
      stampDutyRate,
      buyersFee,
      dueDiligence,
      legalCosts,
    },
    [
      { variable: "salePricePerLot" as keyof typeof profitResult, changes: [-20, -10, 10, 20] },
      { variable: "constructionCostPerSqm" as keyof typeof profitResult, changes: [-20, -10, 10, 20] },
    ]
  );

  return {
    totalRevenue: profitResult.totalRevenue,
    gstAmount: useMarginScheme ? (salePricePerDwelling - purchasePrice / numDwellings) * 0.1 * numDwellings : 0,
    totalCosts: profitResult.totalCosts,
    profit: profitResult.profit,
    profitMargin: profitResult.profitMargin,
    loanAmount: loanCalc.loanAmount,
    cashRequired: loanCalc.cashRequired,
    monthlyInterestPayment: loanCalc.monthlyPayment,
    comparison,
    cashflow: [], // TODO: implement
    sensitivity: sensitivity.map((s) => ({
      label: s.label,
      profit: s.profit,
      margin: s.margin,
    })),
  };
}
```

---

## Batch 5: Input Components

### Task 5.1: PropertyInputs Component

```
Priority: P0
Estimated Time: 30 minutes
```

**Create `src/components/inputs/PropertyInputs.tsx`:**

```typescript
"use client";

import { Collapsible } from "@/components/ui/Collapsible";
import { NumberField } from "@/components/ui/NumberField";
import { useFeasibilityStore } from "@/stores/feasibilityStore";

export function PropertyInputs() {
  const { inputs, setInputs } = useFeasibilityStore();

  return (
    <Collapsible title="Property Details">
      <div className="space-y-4">
        <NumberField
          label="Purchase Price"
          value={inputs.property.purchasePrice}
          onChange={(value) => setInputs({ property: { ...inputs.property, purchasePrice: value } })}
          prefix="$"
          min={0}
        />
        <NumberField
          label="Land Area"
          value={inputs.property.landArea}
          onChange={(value) => setInputs({ property: { ...inputs.property, landArea: value } })}
          suffix="sqm"
          min={0}
        />
      </div>
    </Collapsible>
  );
}
```

---

### Task 5.2: DevelopmentInputs Component

```
Priority: P0
Estimated Time: 45 minutes
```

**Create `src/components/inputs/DevelopmentInputs.tsx`:**

```typescript
"use client";

import { Collapsible } from "@/components/ui/Collapsible";
import { NumberField } from "@/components/ui/NumberField";
import { useFeasibilityStore } from "@/stores/feasibilityStore";

export function DevelopmentInputs() {
  const { inputs, setInputs } = useFeasibilityStore();

  return (
    <Collapsible title="Development Costs">
      <div className="space-y-4">
        <NumberField
          label="Number of Dwellings/Lots"
          value={inputs.development.numDwellings}
          onChange={(value) => setInputs({ development: { ...inputs.development, numDwellings: value } })}
          min={1}
          max={100}
        />
        <NumberField
          label="Construction Cost per sqm"
          value={inputs.development.constructionCostPerSqm}
          onChange={(value) => setInputs({ development: { ...inputs.development, constructionCostPerSqm: value } })}
          prefix="$"
          min={0}
        />
        <NumberField
          label="Demolition Cost"
          value={inputs.development.demolitionCost}
          onChange={(value) => setInputs({ development: { ...inputs.development, demolitionCost: value } })}
          prefix="$"
          min={0}
        />
        <NumberField
          label="Town Planning Fees"
          value={inputs.development.townPlanningPercent}
          onChange={(value) => setInputs({ development: { ...inputs.development, townPlanningPercent: value } })}
          suffix="%"
          min={0}
          max={10}
        />
        <NumberField
          label="Building Permits"
          value={inputs.development.buildingPermitsPercent}
          onChange={(value) => setInputs({ development: { ...inputs.development, buildingPermitsPercent: value } })}
          suffix="%"
          min={0}
          max={10}
        />
        <NumberField
          label="Utilities/Tapping"
          value={inputs.development.utilitiesCost}
          onChange={(value) => setInputs({ development: { ...inputs.development, utilitiesCost: value } })}
          prefix="$"
          min={0}
        />
        <NumberField
          label="Holding Cost"
          value={inputs.development.holdingCostPercent}
          onChange={(value) => setInputs({ development: { ...inputs.development, holdingCostPercent: value } })}
          suffix="%"
          min={0}
          max={5}
        />
        <NumberField
          label="Contingency"
          value={inputs.development.contingencyPercent}
          onChange={(value) => setInputs({ development: { ...inputs.development, contingencyPercent: value } })}
          suffix="%"
          min={0}
          max={20}
        />
        <NumberField
          label="Marketing & Selling"
          value={inputs.development.marketingCostPercent}
          onChange={(value) => setInputs({ development: { ...inputs.development, marketingCostPercent: value } })}
          suffix="%"
          min={0}
          max={10}
        />
      </div>
    </Collapsible>
  );
}
```

---

### Task 5.3: FinancingInputs Component

```
Priority: P0
Estimated Time: 30 minutes
```

**Create `src/components/inputs/FinancingInputs.tsx`:**

```typescript
"use client";

import { Collapsible } from "@/components/ui/Collapsible";
import { NumberField } from "@/components/ui/NumberField";
import { Toggle } from "@/components/ui/Toggle";
import { useFeasibilityStore } from "@/stores/feasibilityStore";

export function FinancingInputs() {
  const { inputs, setInputs } = useFeasibilityStore();

  return (
    <Collapsible title="Financing">
      <div className="space-y-4">
        <Toggle
          label="Loan-to-Value Ratio (LVR)"
          options={[
            { label: "70%", value: 70 },
            { label: "80%", value: 80 },
          ]}
          value={inputs.financing.lvr}
          onChange={(value) => setInputs({ financing: { ...inputs.financing, lvr: value as 70 | 80 } })}
        />
        <NumberField
          label="Interest Rate"
          value={inputs.financing.interestRate}
          onChange={(value) => setInputs({ financing: { ...inputs.financing, interestRate: value } })}
          suffix="%"
          min={0}
          max={20}
          step={0.1}
        />
        <NumberField
          label="Loan Term"
          value={inputs.financing.loanTermMonths}
          onChange={(value) => setInputs({ financing: { ...inputs.financing, loanTermMonths: value } })}
          suffix="months"
          min={1}
          max={60}
        />
        <NumberField
          label="Establishment Fee"
          value={inputs.financing.establishmentFeePercent}
          onChange={(value) => setInputs({ financing: { ...inputs.financing, establishmentFeePercent: value } })}
          suffix="%"
          min={0}
          max={5}
          step={0.05}
        />
        <NumberField
          label="Broker Fee"
          value={inputs.financing.brokerFeePercent}
          onChange={(value) => setInputs({ financing: { ...inputs.financing, brokerFeePercent: value } })}
          suffix="%"
          min={0}
          max={5}
          step={0.05}
        />
        <NumberField
          label="Settlement Fee"
          value={inputs.financing.settlementFee}
          onChange={(value) => setInputs({ financing: { ...inputs.financing, settlementFee: value } })}
          prefix="$"
          min={0}
        />
      </div>
    </Collapsible>
  );
}
```

---

### Task 5.4: RevenueInputs Component

```
Priority: P0
Estimated Time: 30 minutes
```

**Create `src/components/inputs/RevenueInputs.tsx`:**

```typescript
"use client";

import { Collapsible } from "@/components/ui/Collapsible";
import { NumberField } from "@/components/ui/NumberField";
import { Toggle } from "@/components/ui/Toggle";
import { useFeasibilityStore } from "@/stores/feasibilityStore";

export function RevenueInputs() {
  const { inputs, setInputs } = useFeasibilityStore();

  return (
    <Collapsible title="Revenue">
      <div className="space-y-4">
        <NumberField
          label="Sale Price per Dwelling"
          value={inputs.revenue.salePricePerDwelling}
          onChange={(value) => setInputs({ revenue: { ...inputs.revenue, salePricePerDwelling: value } })}
          prefix="$"
          min={0}
        />
        <Toggle
          label="GST Treatment"
          options={[
            { label: "Margin Scheme", value: true },
            { label: "Full GST", value: false },
          ]}
          value={inputs.revenue.useMarginScheme}
          onChange={(value) => setInputs({ revenue: { ...inputs.revenue, useMarginScheme: value as boolean } })}
        />
      </div>
    </Collapsible>
  );
}
```

---

## Batch 6: Results Components

### Task 6.1: SummaryCards Component

```
Priority: P0
Estimated Time: 30 minutes
```

**Create `src/components/results/SummaryCards.tsx`:**

```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { FeasibilityResults } from "@/types";

interface SummaryCardsProps {
  results: FeasibilityResults;
}

export function SummaryCards({ results }: SummaryCardsProps) {
  const getMarginColor = (margin: number) => {
    if (margin >= 20) return "text-success";
    if (margin >= 15) return "text-warning";
    return "text-error";
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cash Required</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold font-mono">{formatCurrency(results.cashRequired)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Loan Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold font-mono">{formatCurrency(results.loanAmount)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold font-mono">{formatCurrency(results.totalRevenue)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Total Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold font-mono">{formatCurrency(results.totalCosts)}</p>
        </CardContent>
      </Card>

      <Card variant="highlighted" className="col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">Profit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-3xl font-bold font-mono ${getMarginColor(results.profitMargin)}`}>
            {formatCurrency(results.profit)}
          </p>
          <p className={`text-sm font-medium ${getMarginColor(results.profitMargin)}`}>
            {formatPercent(results.profitMargin)} margin
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Task 6.2: ComparisonTable Component

```
Priority: P0
Estimated Time: 30 minutes
```

**Create `src/components/results/ComparisonTable.tsx`:**

```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { ComparisonRow } from "@/types";

interface ComparisonTableProps {
  comparison: ComparisonRow[];
}

export function ComparisonTable({ comparison }: ComparisonTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>LVR Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Metric</th>
                {comparison.map((row) => (
                  <th key={row.lvr} className="text-right py-2 font-medium">
                    {row.lvr}% LVR
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 text-gray-600">Loan Amount</td>
                {comparison.map((row) => (
                  <td key={row.lvr} className="py-2 text-right font-mono">
                    {formatCurrency(row.loan)}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-600">Cash Required</td>
                {comparison.map((row) => (
                  <td key={row.lvr} className="py-2 text-right font-mono">
                    {formatCurrency(row.cashRequired)}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-600">Monthly Interest</td>
                {comparison.map((row) => (
                  <td key={row.lvr} className="py-2 text-right font-mono">
                    {formatCurrency(row.monthlyPayment)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 text-gray-600">Profit After Interest</td>
                {comparison.map((row) => (
                  <td key={row.lvr} className="py-2 text-right font-mono font-semibold">
                    {formatCurrency(row.profitAfterInterest)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Task 6.3: SensitivityAnalysis Component

```
Priority: P1
Estimated Time: 30 minutes
```

**Create `src/components/results/SensitivityAnalysis.tsx`:**

```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { SensitivityRow } from "@/types";

interface SensitivityAnalysisProps {
  sensitivity: SensitivityRow[];
}

export function SensitivityAnalysis({ sensitivity }: SensitivityAnalysisProps) {
  const getRowColor = (profit: number) => {
    if (profit > 0) return "text-success";
    if (profit === 0) return "text-gray-600";
    return "text-error";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sensitivity Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Scenario</th>
                <th className="text-right py-2 font-medium">Profit</th>
                <th className="text-right py-2 font-medium">Margin</th>
              </tr>
            </thead>
            <tbody>
              {sensitivity.map((row, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 font-medium">{row.label}</td>
                  <td className={`py-2 text-right font-mono ${getRowColor(row.profit)}`}>
                    {formatCurrency(row.profit)}
                  </td>
                  <td className={`py-2 text-right font-mono ${getRowColor(row.margin)}`}>
                    {formatPercent(row.margin)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Task 6.4: CostBreakdownChart Component

```
Priority: P1
Estimated Time: 45 minutes
```

**Create `src/components/results/CostBreakdownChart.tsx`:**

```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface CostBreakdownChartProps {
  costs: {
    acquisition: number;
    construction: number;
    development: number;
    financing: number;
    marketing: number;
    holding: number;
  };
}

const COLORS = ["#1E3A5F", "#00B8A9", "#10B981", "#F59E0B", "#EF4444", "#64748B"];

export function CostBreakdownChart({ costs }: CostBreakdownChartProps) {
  const data = [
    { name: "Acquisition", value: costs.acquisition },
    { name: "Construction", value: costs.construction },
    { name: "Development", value: costs.development },
    { name: "Financing", value: costs.financing },
    { name: "Marketing", value: costs.marketing },
    { name: "Holding", value: costs.holding },
  ].filter((d) => d.value > 0);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-right text-sm text-gray-600">
          Total: <span className="font-mono font-semibold">{formatCurrency(total)}</span>
        </p>
      </CardContent>
    </Card>
  );
}
```

---

## Batch 7: Main Application Layout

### Task 7.1: Header Component

```
Priority: P0
Estimated Time: 20 minutes
```

**Create `src/components/layout/Header.tsx`:**

```typescript
"use client";

import { Button } from "@/components/ui/Button";
import { Calculator } from "lucide-react";
import { useFeasibilityStore } from "@/stores/feasibilityStore";

export function Header() {
  const { resetInputs } = useFeasibilityStore();

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-8 w-8 text-accent" />
          <h1 className="text-xl font-bold text-primary">Fease-it</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={resetInputs}>
            New
          </Button>
          <Button variant="secondary">Export</Button>
        </div>
      </div>
    </header>
  );
}
```

---

### Task 7.2: Main Page Layout

```
Priority: P0
Estimated Time: 45 minutes
```

**Update `src/app/page.tsx`:**

```typescript
"use client";

import { Header } from "@/components/layout/Header";
import { PropertyInputs } from "@/components/inputs/PropertyInputs";
import { DevelopmentInputs } from "@/components/inputs/DevelopmentInputs";
import { FinancingInputs } from "@/components/inputs/FinancingInputs";
import { RevenueInputs } from "@/components/inputs/RevenueInputs";
import { SummaryCards } from "@/components/results/SummaryCards";
import { ComparisonTable } from "@/components/results/ComparisonTable";
import { SensitivityAnalysis } from "@/components/results/SensitivityAnalysis";
import { useFeasibilityStore } from "@/stores/feasibilityStore";
import { calculateFeasibility } from "@/lib/calculations";
import { useEffect, useMemo } from "react";

export default function Home() {
  const { inputs, results, setResults } = useFeasibilityStore();

  // Calculate results whenever inputs change
  const calculatedResults = useMemo(() => {
    return calculateFeasibility(inputs);
  }, [inputs]);

  // Update store with calculated results
  useEffect(() => {
    setResults(calculatedResults);
  }, [calculatedResults, setResults]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Panel */}
          <div className="space-y-4">
            <PropertyInputs />
            <DevelopmentInputs />
            <FinancingInputs />
            <RevenueInputs />
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            {calculatedResults && (
              <>
                <SummaryCards results={calculatedResults} />
                <ComparisonTable comparison={calculatedResults.comparison} />
                <SensitivityAnalysis sensitivity={calculatedResults.sensitivity} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
```

---

## Batch 8: Testing & Deployment

### Task 8.1: Manual Testing Checklist

- [ ] All inputs update results in real-time
- [ ] Profit margin color coding works (green > 20%, amber 15-20%, red < 15%)
- [ ] Comparison table shows both 70% and 80% LVR
- [ ] Sensitivity analysis shows correct scenarios
- [ ] Mobile layout is usable (375px width)
- [ ] CSV export works
- [ ] localStorage save/load works

### Task 8.2: Deployment Steps

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts
# Production URL will be generated
```

---

## Task Completion Status

| Batch | Task | Status |
|-------|------|--------|
| 1 | Project Foundation | Pending |
| 2 | Core UI Components | Pending |
| 3 | State Management | Pending |
| 4 | Calculation Engine | Pending |
| 5 | Input Components | Pending |
| 6 | Results Components | Pending |
| 7 | Main Layout | Pending |
| 8 | Testing & Deploy | Pending |

---

*Document Status: Ready for execution*
*Last Updated: 2025-05-11*
