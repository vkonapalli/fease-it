# Fease-it: Remaining Batches (5–8) — Detailed Execution Plan

Use this document to resume work in a new session. Each batch is self-contained with files to modify, create, and acceptance criteria.

---

## Batch 5: Development Costs & GST Overhaul

**Goal:** New cost categories, GST toggles, remove operating reserve, %→$ display everywhere.

### 5.1 Remove Operating Reserve & Repairs
- **Files:** `app/types/index.ts`, `app/stores/appStore.ts`, `app/lib/calculations/profit.ts`, `app/components/inputs/DevelopmentInputs.tsx`, `app/components/results/SummaryCards.tsx` (if it shows operating reserve)
- **Tasks:**
  - [ ] Remove `operatingReserve` field from `DevelopmentInputs` type
  - [ ] Remove from `createDefaultInputs()` in `appStore.ts`
  - [ ] Remove from `calculateDevelopmentCosts()` in `profit.ts`
  - [ ] Remove `Operating Reserve` input field from `DevelopmentInputs.tsx`
  - [ ] Remove `operatingReserve` from `CostBreakdown` type and all result displays

### 5.2 New Global Cost Items
- **Files:** `app/stores/appStore.ts`, `app/components/inputs/DevelopmentInputs.tsx`
- **Tasks:**
  - [ ] Add default cost items to `globalCosts`:
    - Land Surveying ($0)
    - Utilities — Water ($0, GST-free)
    - Utilities — Electricity ($0, GST-free)
    - Council Costs ($0, GST-free)
  - [ ] Update `DevelopmentInputs.tsx` to show GST treatment badge per cost item

### 5.3 Contingency Default Change
- **Files:** `app/stores/appStore.ts`
- **Tasks:**
  - [ ] Change `contingencyPercent` default from `2` → `5`

### 5.4 GST Toggle Per Line Item
- **Files:** `app/types/index.ts`, `app/stores/appStore.ts`, `app/lib/calculations/profit.ts`
- **Tasks:**
  - [ ] Extend `AcquisitionCostItem` and `DevelopmentCostItem` with `gstTreatment: "free" | "inclusive" | "exclusive"`
  - [ ] Build `GSTToggle` mini-component (3-segment: Free | Inc | Exc)
  - [ ] Add toggle to every cost line item in UI
  - [ ] Default logic:
    - Government items (stamp duty, land tax, council): `free`
    - Utilities (water, electricity): `free`
    - All others: `inclusive`
  - [ ] Update `calculateDevelopmentCosts()` and `calculateAcquisitionCosts()` to factor GST treatment:
    - `inclusive`: amount includes GST; GST component = amount − (amount / 1.1)
    - `exclusive`: amount excludes GST; total = amount × 1.1
    - `free`: total = amount; GST = 0

### 5.5 Global GST Toggle
- **Files:** `app/types/index.ts`, `app/stores/appStore.ts`, `app/components/inputs/DevelopmentInputs.tsx`
- **Tasks:**
  - [ ] Add `gstGlobalTreatment: "inclusive" | "exclusive"` to `DevelopmentInputs`
  - [ ] Global toggle at top of Development Costs section
  - [ ] When toggled, bulk-update all line items' `gstTreatment` (except `free` items)

### 5.6 % → $ Display Component
- **Files:** `app/components/ui/ComputedDollar.tsx` (new)
- **Tasks:**
  - [ ] Build `ComputedDollarDisplay` component
  - [ ] Props: `percentage`, `baseAmount`, `label?`
  - [ ] Shows "≈ $X" computed in real time
  - [ ] Style: muted text, small font, right-aligned

### 5.7 Apply %→$ Everywhere
- **Files:** All input components with % fields
- **Tasks:**
  - [ ] Stamp duty % → computed $ (base: purchase price)
  - [ ] Town planning % → computed $ (base: total revenue)
  - [ ] Building permits % → computed $
  - [ ] Holding cost % → computed $
  - [ ] Contingency % → computed $ (base: total dev cost)
  - [ ] Marketing % → computed $ (base: total revenue)
  - [ ] Financing fees % → computed $ (base: loan amount)
  - [ ] Sales commission % → computed $ (base: total revenue)
  - [ ] LVR % → computed $ (base: property value or net GRV/costs)

### Acceptance Criteria
- [ ] Contingency shows 5% default
- [ ] Operating Reserve field removed completely
- [ ] GST toggle per line item works
- [ ] Global GST toggle bulk-updates non-free items
- [ ] Every % input shows computed $ equivalent
- [ ] TypeScript clean build

---

## Batch 6: Revenue, Tax & Commissions

**Goal:** GST margin scheme toggle, CGT estimate, sales commission.

### 6.1 GST Margin Scheme Toggle
- **Files:** `app/components/inputs/RevenueInputs.tsx`, `app/lib/calculations/gst.ts`, `app/lib/calculations/profit.ts`
- **Tasks:**
  - [ ] Add toggle in Revenue section: "Apply Margin Scheme" (on/off)
  - [ ] When ON: GST per lot = 10% × (salePrice − costBasePerLot)
  - [ ] Cost base defaults to `purchasePrice / numLots`; allow override per lot
  - [ ] When OFF: use selected GST treatment (full GST, GST-free, etc.)
  - [ ] Display "Margin Scheme GST: $X" in results

### 6.2 CGT Calculation
- **Files:** `app/components/results/SummaryCards.tsx` or new `TaxLiabilityCard.tsx`
- **Tasks:**
  - [ ] Add `cgtEstimate` to `ScenarioResult` (informational, not deducted from profit)
  - [ ] Formula:
    - If hold period > 12 months: `cgt = (salePrice − costBase) × 0.5 × 0.45` (50% discount, 45% marginal rate)
    - Else: `cgt = (salePrice − costBase) × 0.45`
  - [ ] Show as "Estimated Tax Liability: $X"
  - [ ] Add disclaimer: "Consult your accountant. Development profits may be treated as ordinary income."

### 6.3 Sales Commission
- **Files:** `app/components/inputs/RevenueInputs.tsx`, `app/lib/calculations/profit.ts`
- **Tasks:**
  - [ ] Add to Revenue section:
    - Toggle: "% based" vs "Flat fee"
    - % based: input (default 1.5%), computed $ shown
    - Flat fee: input $
  - [ ] Add commission to total costs in profit calculation
  - [ ] Display in results: "Sales Commission: $X"

### Acceptance Criteria
- [ ] Margin scheme ON: purchase $2M, 2 lots, sale $1.75M each → GST = $37,000 total
- [ ] Margin scheme OFF, full GST → GST = $350,000 total
- [ ] Commission 1.5% on $3.5M revenue → $52,500
- [ ] CGT estimate shows with disclaimer
- [ ] TypeScript clean build

---

## Batch 7: Financing & Capital Stack

**Goal:** Capital spread schedule, capital stack tiers, total deficit.

### 7.1 Capital Spread Schedule
- **Files:** `app/types/index.ts`, `app/components/inputs/CapitalSpreadInputs.tsx` (new)
- **Tasks:**
  - [ ] Add `CapitalSpreadItem` type:
    - description, amount ($) OR percentage (% of total project cost), date, type (Deposit / Progress / Final), linkedStackCategory
  - [ ] Build `CapitalSpreadInputs` table component
  - [ ] Allow add/delete rows
  - [ ] If % entered, compute $ based on total project cost
  - [ ] Date can be calendar date or "Month N"

### 7.2 Capital Stack UI
- **Files:** `app/components/inputs/CapitalStackInputs.tsx` (new)
- **Tasks:**
  - [ ] Build vertical tier component:
    1. Senior Debt
    2. Mezzanine Debt
    3. Private Lending
    4. Profit Sharing
    5. Developer Equity
    6. Other Equity

### 7.3 Senior Debt
- **Tasks:**
  - [ ] Inputs: LVR %, Interest rate, Toggle (Net GRV vs Net Project Costs)
  - [ ] Establishment fee %, Broker fee %, Settlement fee $
  - [ ] Calculation:
    - Net GRV base = totalRevenue − marginSchemeGst
    - Net Project Costs base = acquisition + development + financing fees
    - Loan = LVR% × base

### 7.4 Mezzanine Debt
- **Tasks:**
  - [ ] Same fields as Senior Debt
  - [ ] Independent LVR and interest rate
  - [ ] Loan = LVR% × selected base

### 7.5 Private Lending
- **Tasks:**
  - [ ] Inputs: Amount $ OR % of total cost, Interest rate %
  - [ ] If % entered, compute $

### 7.6 Profit Sharing
- **Tasks:**
  - [ ] Inputs: Amount committed ($), % on total capital, % of profit share
  - [ ] Display "Profit Share Entitlement: $X" (computed after profit known)

### 7.7 Developer Equity
- **Tasks:**
  - [ ] Computed read-only by default
  - [ ] Formula: `developerEquity = totalProjectCost − seniorDebt − mezzanine − privateLending − otherEquity − profitSharingAmount`
  - [ ] Allow manual override

### 7.8 Other Equity
- **Tasks:**
  - [ ] Simple amount or % input
  - [ ] Treated same as developer equity in stack priority

### 7.9 Total Deficit
- **Files:** `app/components/results/DeficitCard.tsx` (new)
- **Tasks:**
  - [ ] Formula: `deficit = totalProjectCost − (seniorDebt + mezzanine + privateLending + committedEquity)`
  - [ ] Prominent card in Financing Results
  - [ ] Red badge if > 0: "Funding Gap: $X"
  - [ ] Green badge if ≤ 0: "Fully Funded"
  - [ ] Tooltip: "Deficit = Total Cost − Total Committed Capital"

### 7.10 Capital Spread → Stack Auto-Link
- **Tasks:**
  - [ ] When spread item has "Linked Stack Category" selected:
  - [ ] Sum of spread items in that category auto-populates stack tier amount
  - [ ] Manual override takes precedence

### Acceptance Criteria
- [ ] Senior Debt 70% LVR on Net GRV $5M → $3.5M loan
- [ ] Total cost $4M, debt $3M, equity $500k → deficit $500k (red)
- [ ] Add $500k Developer Equity → deficit $0 (green)
- [ ] TypeScript clean build

---

## Batch 8: Polish, Bug Fixes & Deploy

**Goal:** Fix known bugs, responsive UI, Vercel deployment.

### 8.1 Fix Known Bugs (AGENTS.md)
- **Tasks:**
  - [ ] **Bug #1:** Add `"sda-hold"` to `SCENARIOS` array in `app/lib/calculations/index.ts`
  - [ ] **Bug #2:** In `generateCashflow()`, replace hardcoded `0.06` with `inputs.financing.interestRate`
  - [ ] **Bug #3:** Rename `sdaBasicWeekly` → `sdaBasicMonthly`, `rrcWeekly` → `rrcMonthly`, `ooaLeaseWeekly` → `ooaLeaseMonthly` in types, store, components
  - [ ] **Bug #4:** Verify no `useEffect` pushes derived results into Zustand (already fixed in Batch 1)
  - [ ] **Bug #5:** Add `useShallow` to Zustand consumers where appropriate

### 8.2 Dependency Cleanup
- **Tasks:**
  - [ ] Evaluate `react-hook-form`, `@hookform/resolvers`, `zod` — remove if unused
  - [ ] Verify `lucide-react ^1.14.0` — downgrade to `^0.x` if package is invalid

### 8.3 Responsive Polish
- **Tasks:**
  - [ ] Test on iPhone SE width (375px)
  - [ ] Scenario tabs: horizontal scroll or dropdown on mobile
  - [ ] Capital Stack: stack vertically on mobile
  - [ ] Input/Results panels: single column on < 1024px
  - [ ] Tables: horizontal scroll wrapper

### 8.4 Vercel Deployment
- **Tasks:**
  - [ ] Install `@vercel/react-router` adapter or configure `vercel.json`
  - [ ] Add environment variables to Vercel dashboard:
    - `SUPABASE_URL`
    - `SUPABASE_PUBLISHABLE_KEY`
    - `SUPABASE_SECRET_KEY`
    - `GOOGLE_PLACES_API_KEY`
  - [ ] Deploy with `vercel --prod`
  - [ ] Verify SSR (view page source, confirm HTML rendered)
  - [ ] Verify Supabase connection (create scenario, reload, confirm persisted)

### 8.5 Final QA Checklist
- [ ] Create project → add 3 scenarios → copy one → delete one
- [ ] Enter VIC address → stamp duty auto-calculates
- [ ] Set 18-month timeline → land tax prorates
- [ ] Switch pricing models → revenue updates
- [ ] Toggle GST global / per-line → costs update
- [ ] Capital stack: adjust LVR → deficit updates live
- [ ] Mobile: all actions possible without horizontal scroll

---

## Current Git State

```
main branch
Batch 1: 03dbe81 — Supabase, multi-scenario architecture
Batch 2: 4a569a3 — Address autocomplete, stamp duty & land tax
Batch 3: 005b247 — Copy with options, cross-scenario comparison
Batch 4: 7abb19c — Development strategy & sale pricing
```

**To resume:** `git log --oneline` to verify, then start with Batch 5.
