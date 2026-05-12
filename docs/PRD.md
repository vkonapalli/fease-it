# Fease-it: Property Development Feasibility Platform

## Product Requirements Document

---

## 1. Overview

**Product Name:** Fease-it

**Type:** Web-based SaaS application

**What:** A feasibility tool for Australian property developers to quickly assess subdivision/land development profitability using an intuitive interface instead of error-prone spreadsheets.

**Why:** Existing tools (Feastudy $880/yr, Aprao) are expensive, complex, or lack AU-specific features. Spreadsheets are error-prone and hard to maintain.

**Target Users:**

- MVP: Individual property developers
- Phase 2: Boutique developer firms (2-10 people)

**Target Market:** Australia (GST, stamp duty, land tax, margin scheme)

---

## 2. Vision

A modern, fast, mobile-friendly feasibility tool that lets developers input property details and instantly see profitability. No more broken formulas or spreadsheet version control issues.

**Core Promise:** From input to insight in under 60 seconds.

---

## 3. User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-01 | As a developer, I want to input land details and instantly see profitability | P0 |
| US-02 | As a developer, I want to compare funding options (70% vs 80% LVR) | P0 |
| US-03 | As a developer, I want to model GST margin scheme correctly (AU-specific) | P0 |
| US-04 | As a developer, I want to see cashflow across project timeline | P1 |
| US-05 | As a developer, I want to model JV partner returns | P2 |
| US-06 | As a developer, I want sensitivity analysis on key variables | P1 |
| US-07 | As a developer, I want to model build-and-hold rental scenario | P2 |

---

## 4. Core Scenarios (MVP Scope)

### Scenario A: Land Subdivision (Sell All)

**Primary use case from spreadsheet ("2 x Land Sales@ 80 LVR")**

**Flow:**

1. User enters land purchase price and area
2. User enters number of lots to create
3. User enters sale price per lot
4. System calculates construction costs, GST, profit

**Outputs:**

- Total revenue (sale price × lots)
- Total costs (acquisition + development)
- Profit ($ and %)
- Cash required
- Loan amount at selected LVR

### Scenario B: Land + Build

**From spreadsheet ("1 land + 1 build")**

**Flow:**

1. User enters land + construction details
2. System calculates build cost per sqm
3. User sees combined land + construction profit

### Scenario C: Sell 1 Hold 1

**From spreadsheet ("Sell 1 hold 1 at 70% LVR")**

**Flow:**

1. User sells one lot at start
2. User holds remaining lot for rental income
3. System shows sale profit + ongoing rental cashflow

---

## 5. Financial Parameters

### 5.1 Acquisition Inputs

| Parameter | Type | Default | Validation |
|-----------|------|---------|------------|
| Land purchase price | $ | Required | > 0 |
| Land area | sqm | Required | > 0 |
| Stamp duty rate | % | 6% (VIC) | 0-10% |
| Buyers fee | $ | 40,000 | >= 0 |
| Due diligence | $ | 15,000 | >= 0 |
| Settlement/legal | $ | 3,000 | >= 0 |

### 5.2 Development Costs

| Parameter | Type | Default | Validation |
|-----------|------|---------|------------|
| Number of dwellings/lots | # | Required | 1-100 |
| Construction cost per sqm | $/sqm | Market rate | > 0 |
| Demolition cost | $ | 0 | >= 0 |
| Town planning fees | % | 0.6% | 0-5% |
| Building permits | % | 0.6% | 0-5% |
| Utilities/tapping | $ | 25,000 | >= 0 |
| Holding cost | % | 0.5% | 0-5% |
| Contingency | % | 2% | 0-10% |
| Marketing & selling | % | 1.5% | 0-5% |

### 5.3 Financing Inputs

| Parameter | Type | Options | Default |
|-----------|------|---------|---------|
| LVR | % | 70%, 80% | 70% |
| Interest rate | % | 5-10% | 6% |
| Loan term | months | 6-60 | 12 |
| Establishment fee | % | 0.3-1% | 0.5% |
| Broker fee | % | 0-2% | 0.5% |
| Settlement fee | $ | 0-5,000 | 500 |

### 5.4 Revenue Inputs

| Parameter | Type | Notes |
|-----------|------|-------|
| Sale price per dwelling | $ | Or use $/sqm calc |
| GST treatment | Full / Margin | Default: Margin |
| Capital growth (hold) | % | 5%/yr default |
| Rental income per unit | $/week | If holding |
| Rental growth | % | 4%/yr default |

### 5.5 Build & Hold Operating Costs

| Item | Monthly | Escalation |
|------|---------|------------|
| Council rates | $1,270 | 3%/yr |
| Insurance | $500 | 5%/yr |
| Landscaping | $300 | 0 |
| Repairs & maintenance | $500 | 3%/yr |
| Property management | 6% | Of rent |
| Letting fee | $200 | Per new tenant |
| Land tax | $29,000/yr | State thresholds |

---

## 6. Key Calculations (AU-Specific)

### 6.1 GST Margin Scheme (Critical for AU)

```
Margin = Sale Price - (Purchase Price / Total Lots)
GST = Margin × 10%
```

**NOT:** Sale Price × 10% (this is wrong for margin scheme)

**Example:**

- Purchase price: $2,760,000 (2 lots = $1.38M each)
- Sale price per lot: $1,750,000
- Margin = $1,750,000 - $1,380,000 = $370,000
- GST = $37,000 (not $175,000)

### 6.2 Profit Metrics

```
Total Revenue = Sum of all sale prices
Total Costs = Acquisition + Development + Financing + Marketing
Profit = Total Revenue - Total Costs
Profit Margin % = (Profit / Total Costs) × 100
Cash Required = Purchase Price - (Property Value × LVR) + All Other Costs
```

### 6.3 Loan Calculations

```
Loan Amount = Property Value × LVR%
Monthly Interest-Only Payment = Loan × (Interest Rate / 12)
```

### 6.4 JV Profit Split

```
Total Investment = Developer Cash + Investor Cash
Investor Share % = (Investor Amount / Total Investment) × Target %
Developer Share % = 100% - Investor Share %
```

---

## 7. Reports & Outputs

### 7.1 Dashboard Summary (Real-time)

```
┌────────────────────────────────────────────────────┐
│  PURCHASE PRICE        $2,760,000                  │
│  CASH REQUIRED         $850,000                    │
│  LOAN (80% LVR)        $2,208,000                  │
├────────────────────────────────────────────────────┤
│  TOTAL REVENUE         $3,830,000                  │
│  TOTAL COSTS           $3,200,000                  │
│  PROFIT                $630,000                    │
│  PROFIT MARGIN         19.7%                       │
├────────────────────────────────────────────────────┤
│  IRR                   25.4%                       │
│  PAYBACK PERIOD        14 months                   │
└────────────────────────────────────────────────────┘
```

### 7.2 Comparison View

Side-by-side LVR scenarios:

| Metric | 70% LVR | 80% LVR |
|--------|---------|---------|
| Loan Amount | $1,932,000 | $2,208,000 |
| Cash Required | $1,126,000 | $850,000 |
| Monthly Interest | $9,660 | $11,040 |
| Profit After Interest | $520,000 | $630,000 |

### 7.3 Cost Breakdown

Pie/bar chart showing:

- Land purchase
- Construction
- Stamp duty & fees
- Marketing
- Holding costs
- Financing fees

### 7.4 Cashflow Table

Monthly columns Jan 2026 → Project end:

| Month | Income | Expenses | Net | Cumulative |
|-------|--------|----------|-----|------------|
| Jan 26 | $0 | $15,000 | -$15,000 | -$15,000 |
| Feb 26 | $0 | $50,000 | -$50,000 | -$65,000 |

### 7.5 Sensitivity Analysis

Table showing profit at different variables:

| Construction Cost | Sale Price | Profit | Margin |
|-------------------|------------|--------|--------|
| -20% | Base | $850,000 | 26.6% |
| Base | Base | $630,000 | 19.7% |
| +20% | Base | $410,000 | 12.8% |

---

## 8. UI/UX Requirements

### 8.1 Layout (Desktop)

```
┌────────────────────────────────────────────────────────────────┐
│  Fease-it                    [New] [Save] [Export] [?]         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────┐  ┌─────────────────────────────────┐ │
│  │                      │  │                                 │ │
│  │    INPUT PANEL       │  │       RESULTS PANEL             │ │
│  │                      │  │                                 │ │
│  │  ▼ Property Details  │  │   ┌─────────────────────────┐   │ │
│  │    Purchase Price    │  │   │    Summary Cards       │   │ │
│  │    Land Area         │  │   │    Profit: $630,000    │   │ │
│  │                      │  │   └─────────────────────────┘   │ │
│  │  ▼ Development       │  │                                 │ │
│  │    # of Lots         │  │   ┌─────────────────────────┐   │ │
│  │    Construction $    │  │   │    Comparison Chart    │   │ │
│  │                      │  │   └─────────────────────────┘   │ │
│  │  ▼ Financing         │  │                                 │ │
│  │    LVR: [70%][80%]   │  │   ┌─────────────────────────┐   │ │
│  │    Interest Rate     │  │   │    Cashflow Table      │   │ │
│  │                      │  │   └─────────────────────────┘   │ │
│  │  ▼ Revenue           │  │                                 │ │
│  │    Sale Price/Lot    │  │   ┌─────────────────────────┐   │ │
│  │    GST: [Full][Marg] │  │   │    Sensitivity Table    │   │ │
│  │                      │  │   └─────────────────────────┘   │ │
│  │  [Run Feasibility]    │  │                                 │ │
│  │                      │  │                                 │ │
│  └──────────────────────┘  └─────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 8.2 Layout (Mobile)

```
┌─────────────────────┐
│  Fease-it        ☰  │
├─────────────────────┤
│                     │
│   SUMMARY CARDS     │
│   ─────────────────│
│   Profit: $630,000  │
│   Margin: 19.7%    │
│                     │
│   ─────────────────│
│   INPUT SECTIONS    │
│                     │
│   ▼ Property        │
│   ▼ Development     │
│   ▼ Financing       │
│   ▼ Revenue         │
│                     │
│   [Run Feasibility] │
│                     │
│   ─────────────────│
│   RESULTS           │
│   ▼ Comparison      │
│   ▼ Cashflow        │
│   ▼ Sensitivity      │
│                     │
└─────────────────────┘
```

### 8.3 Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | Deep Navy | #1E3A5F | Headers, buttons |
| Secondary | Slate | #64748B | Secondary text |
| Accent | Teal | #00B8A9 | CTAs, highlights |
| Success | Emerald | #10B981 | Positive values |
| Warning | Amber | #F59E0B | Margins < 20% |
| Error | Rose | #EF4444 | Negative profit |
| Background | White/Gray | #FFFFFF/#F8FAFC | Cards, body |
| Text | Charcoal | #1E293B | Body text |

### 8.4 Typography

- Headings: Inter (600-700 weight)
- Body: Inter (400-500 weight)
- Numbers/Data: JetBrains Mono (monospace for alignment)

### 8.5 Interaction Design

- **Instant updates:** Results recalculate as user types (debounced 300ms)
- **Input validation:** Red border + tooltip for invalid values
- **Progress indicators:** Skeleton loading for calculation-intensive sections
- **Empty states:** Helpful prompts when fields are missing
- **Keyboard navigation:** Tab through fields, Enter to submit

---

## 9. Technical Requirements

### 9.1 Tech Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Framework | Next.js 14 (App Router) | SSR, fast builds, good DX |
| Language | TypeScript | Type safety, fewer bugs |
| Styling | Tailwind CSS | Rapid UI development |
| State | Zustand | Lightweight, simple |
| Charts | Recharts | React-native, customizable |
| Forms | React Hook Form + Zod | Performance, validation |
| PDF Export | @react-pdf/renderer | Native React PDF generation |
| Storage | localStorage (MVP) | Simple, no backend needed |
| Deployment | Vercel | Fast, free tier, easy |

### 9.2 Project Structure

```
fease-it/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main application
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Tailwind imports
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Collapsible.tsx
│   │   │   └── ...
│   │   ├── inputs/              # Input sections
│   │   │   ├── PropertyInputs.tsx
│   │   │   ├── DevelopmentInputs.tsx
│   │   │   ├── FinancingInputs.tsx
│   │   │   └── RevenueInputs.tsx
│   │   ├── results/             # Output components
│   │   │   ├── SummaryCards.tsx
│   │   │   ├── ComparisonTable.tsx
│   │   │   ├── CashflowTable.tsx
│   │   │   ├── SensitivityAnalysis.tsx
│   │   │   └── CostBreakdown.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── InputPanel.tsx
│   │       └── ResultsPanel.tsx
│   ├── lib/
│   │   ├── calculations/
│   │   │   ├── gst.ts           # AU GST calculations
│   │   │   ├── profit.ts        # Profit metrics
│   │   │   ├── financing.ts     # Loan calculations
│   │   │   ├── cashflow.ts      # Cashflow projections
│   │   │   └── sensitivity.ts   # Sensitivity analysis
│   │   ├── validation/
│   │   │   └── schemas.ts       # Zod schemas
│   │   └── utils/
│   │       ├── formatters.ts    # Currency, percentages
│   │       └── constants.ts     # Default values
│   ├── stores/
│   │   └── feasibilityStore.ts  # Zustand store
│   └── types/
│       └── index.ts             # TypeScript interfaces
├── public/
│   └── favicon.ico
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

### 9.3 Data Model

```typescript
// types/index.ts

export interface PropertyInputs {
  purchasePrice: number;
  landArea: number; // sqm
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

export interface BuildAndHoldInputs {
  rentalIncomePerUnit: number;
  rentalGrowthRate: number;
  councilRates: number;
  insurance: number;
  landscaping: number;
  repairsAndMaintenance: number;
  propertyManagementPercent: number;
  lettingFee: number;
  landTax: number;
  capitalGrowthRate: number;
}

export interface FeasibilityInputs {
  property: PropertyInputs;
  development: DevelopmentInputs;
  financing: FinancingInputs;
  revenue: RevenueInputs;
  buildAndHold?: BuildAndHoldInputs;
}

export interface FeasibilityResults {
  // Revenue
  totalRevenue: number;
  gstAmount: number;

  // Costs
  acquisitionCosts: number;
  developmentCosts: number;
  financingCosts: number;
  marketingCosts: number;
  totalCosts: number;

  // Profit
  profit: number;
  profitMargin: number;

  // Financing
  loanAmount: number;
  cashRequired: number;
  monthlyInterestPayment: number;
  totalInterestCost: number;

  // Metrics
  irr: number;
  paybackMonths: number;

  // Comparison
  comparison70vs80: {
    lvr: 70 | 80;
    loan: number;
    cashRequired: number;
    monthlyPayment: number;
    profitAfterInterest: number;
  }[];

  // Cashflow (monthly)
  cashflow: CashflowRow[];

  // Sensitivity
  sensitivityAnalysis: SensitivityRow[];
}

export interface CashflowRow {
  month: Date;
  income: number;
  expenses: number;
  netCashflow: number;
  cumulativeCashflow: number;
}

export interface SensitivityRow {
  variable: string;
  changePercent: number;
  profit: number;
  margin: number;
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

### 9.4 Calculation Engine

All calculations in `src/lib/calculations/`:

```typescript
// gst.ts - Australian GST Margin Scheme
export function calculateGSTMarginScheme(
  salePrice: number,
  purchasePrice: number,
  numLots: number
): number {
  const margin = salePrice - (purchasePrice / numLots);
  return Math.max(0, margin * 0.1);
}

// financing.ts - Loan calculations
export function calculateLoanAmount(
  propertyValue: number,
  lvr: number
): number {
  return propertyValue * (lvr / 100);
}

export function calculateMonthlyInterestOnlyPayment(
  loanAmount: number,
  annualRate: number
): number {
  return (loanAmount * annualRate) / 12;
}

// profit.ts - Profit metrics
export function calculateProfit(
  revenue: number,
  costs: number
): { profit: number; margin: number } {
  const profit = revenue - costs;
  const margin = costs > 0 ? (profit / costs) * 100 : 0;
  return { profit, margin };
}

// cashflow.ts - Cashflow projections
export function generateCashflow(
  inputs: FeasibilityInputs,
  results: FeasibilityResults,
  startDate: Date,
  durationMonths: number
): CashflowRow[];

// sensitivity.ts - Sensitivity analysis
export function calculateSensitivity(
  inputs: FeasibilityInputs,
  variable: keyof DevelopmentInputs | keyof RevenueInputs,
  changes: number[]
): SensitivityRow[];
```

---

## 10. Out of Scope (MVP)

- Multi-user collaboration
- User accounts/authentication
- Portfolio management (multiple properties)
- Real-time market data integration (CoreLogic, etc.)
- PDF reports (CSV export only for MVP)
- Native mobile apps (web only, responsive)
- Build-to-rent detailed modeling
- Complex JV structures with waterfall distributions
- GST on commercial properties
- Multi-state calculations (VIC only for MVP)

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Time to first result | < 2 seconds |
| Time to complete feasibility | < 3 minutes |
| Mobile responsiveness | 100% functional on 375px+ width |
| Input validation coverage | 100% of required fields |
| Calculation accuracy | Matches Excel spreadsheet to 99% |
| Lighthouse Performance Score | > 90 |

---

## 12. Open Questions

1. **JV Modeling Scope:** Should MVP include JV profit splits, or just focus on simple debt financing?
2. **Scenario Coverage:** Should MVP include "Sell 1 Hold 1" scenario or just "Sell All"?
3. **Build & Hold:** Include rental cashflow modeling or stick to subdivision?
4. **Data Persistence:** LocalStorage only, or sync to cloud for backup?
5. **Export Priority:** CSV sufficient, or need PDF for investor presentations?
6. **Multi-state Support:** VIC only for MVP, or design for multiple states?

---

## 13. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2025-05-11 | Venky | Initial draft from spreadsheet analysis |

---

*Document Status: Draft - Awaiting stakeholder review*
