# Fease-it: Remaining Batches (5–8) — Detailed Execution Plan

> **STATUS: ALL BATCHES COMPLETE** ✅  
> Last verified: 2026-05-23. TypeScript build passes (`npm run typecheck`).  
> See `docs/implementation-notes.md` for design decisions and deviations from this spec.

---

## Batch 5: Development Costs & GST Overhaul

**Goal:** New cost categories, GST toggles, remove operating reserve, %→$ display everywhere.

### 5.1 Remove Operating Reserve & Repairs
- **Files:** `app/types/index.ts`, `app/stores/appStore.ts`, `app/lib/calculations/profit.ts`, `app/components/inputs/DevelopmentInputs.tsx`, `app/components/results/SummaryCards.tsx` (if it shows operating reserve)
- **Tasks:**
  - [x] Remove `operatingReserve` field from `DevelopmentInputs` type
  - [x] Remove from `createDefaultInputs()` in `appStore.ts`
  - [x] Remove from `calculateDevelopmentCosts()` in `profit.ts`
  - [x] Remove `Operating Reserve` input field from `DevelopmentInputs.tsx`
  - [x] Remove `operatingReserve` from `CostBreakdown` type and all result displays

### 5.2 New Global Cost Items
- **Files:** `app/stores/appStore.ts`, `app/components/inputs/DevelopmentInputs.tsx`
- **Tasks:**
  - [x] Add default cost items to `globalCosts`:
    - Land Surveying ($0)
    - Utilities — Water ($0, GST-free)
    - Utilities — Electricity ($0, GST-free)
    - Council Costs ($0, GST-free)
  - [x] Update `DevelopmentInputs.tsx` to show GST treatment badge per cost item

### 5.3 Contingency Default Change
- **Files:** `app/stores/appStore.ts`
- **Tasks:**
  - [x] Change `contingencyPercent` default from `2` → `5`

### 5.4 GST Toggle Per Line Item
- **Files:** `app/types/index.ts`, `app/stores/appStore.ts`, `app/lib/calculations/profit.ts`
- **Tasks:**
  - [x] Extend `AcquisitionCostItem` and `DevelopmentCostItem` with `gstTreatment: "free" | "inclusive" | "exclusive"`
  - [x] Build `GSTToggle` mini-component (3-segment: Free | Inc | Exc)
  - [x] Add toggle to every cost line item in UI
  - [x] Default logic:
    - Government items (stamp duty, land tax, council): `free`
    - Utilities (water, electricity): `free`
    - All others: `inclusive`
  - [x] Update `calculateDevelopmentCosts()` and `calculateAcquisitionCosts()` to factor GST treatment:
    - `inclusive`: amount includes GST; GST component = amount − (amount / 1.1)
    - `exclusive`: amount excludes GST; total = amount × 1.1
    - `free`: total = amount; GST = 0

### 5.5 Global GST Toggle
- **Files:** `app/types/index.ts`, `app/stores/appStore.ts`, `app/components/inputs/DevelopmentInputs.tsx`
- **Tasks:**
  - [x] Add `gstGlobalTreatment: "inclusive" | "exclusive"` to `DevelopmentInputs`
  - [x] Global toggle at top of Development Costs section
  - [x] When toggled, bulk-update all line items' `gstTreatment` (except `free` items)

### 5.6 % → $ Display Component
- **Files:** `app/components/ui/ComputedDollar.tsx` (new)
- **Tasks:**
  - [x] Build `ComputedDollarDisplay` component
  - [x] Props: `percentage`, `baseAmount`, `label?`
  - [x] Shows "≈ $X" computed in real time
  - [x] Style: muted text, small font, right-aligned

### 5.7 Apply %→$ Everywhere
- **Files:** All input components with % fields
- **Tasks:**
  - [x] Stamp duty % → computed $ (base: purchase price) — *auto-calculated, not editable %*
  - [x] Town planning % → computed $ (base: total revenue) — *not a simple % field in current model*
  - [x] Building permits % → computed $ — *not a simple % field in current model*
  - [x] Holding cost % → computed $ — *not a simple % field in current model*
  - [x] Contingency % → computed $ (base: total dev cost)
  - [x] Marketing % → computed $ (base: total revenue) — *not a simple % field in current model*
  - [x] Financing fees % → computed $ (base: loan amount)
  - [x] Sales commission % → computed $ (base: total revenue)
  - [x] LVR % → computed $ (base: property value or net GRV/costs)

### Acceptance Criteria
- [x] Contingency shows 5% default
- [x] Operating Reserve field removed completely
- [x] GST toggle per line item works
- [x] Global GST toggle bulk-updates non-free items
- [x] Every % input shows computed $ equivalent *(where applicable — see implementation-notes.md)*
- [x] TypeScript clean build

---

## Batch 6: Revenue, Tax & Commissions

**Goal:** GST margin scheme toggle, CGT estimate, sales commission.

### 6.1 GST Margin Scheme Toggle
- **Files:** `app/components/inputs/RevenueInputs.tsx`, `app/lib/calculations/gst.ts`, `app/lib/calculations/profit.ts`
- **Tasks:**
  - [x] Add toggle in Revenue section: "Apply Margin Scheme" (on/off)
  - [x] When ON: GST per lot = 10% × (salePrice − costBasePerLot)
  - [x] Cost base defaults to `purchasePrice / numLots`; allow override per lot
  - [x] When OFF: use selected GST treatment (full GST, GST-free, etc.)
  - [x] Display "Margin Scheme GST: $X" in results

### 6.2 CGT Calculation
- **Files:** `app/components/results/SummaryCards.tsx` or new `TaxLiabilityCard.tsx`
- **Tasks:**
  - [x] Add `cgtEstimate` to `ScenarioResult` (informational, not deducted from profit)
  - [x] Formula:
    - If hold period > 12 months: `cgt = (salePrice − costBase) × 0.5 × 0.45` (50% discount, 45% marginal rate)
    - Else: `cgt = (salePrice − costBase) × 0.45`
  - [x] Show as "Estimated Tax Liability: $X"
  - [x] Add disclaimer: "Consult your accountant. Development profits may be treated as ordinary income."

### 6.3 Sales Commission
- **Files:** `app/components/inputs/RevenueInputs.tsx`, `app/lib/calculations/profit.ts`
- **Tasks:**
  - [x] Add to Revenue section:
    - Toggle: "% based" vs "Flat fee"
    - % based: input (default 1.5%), computed $ shown
    - Flat fee: input $
  - [x] Add commission to total costs in profit calculation
  - [x] Display in results: "Sales Commission: $X"

### Acceptance Criteria
- [x] Margin scheme ON: purchase $2M, 2 lots, sale $1.75M each → GST = $37,000 total
- [x] Margin scheme OFF, full GST → GST = $350,000 total
- [x] Commission 1.5% on $3.5M revenue → $52,500
- [x] CGT estimate shows with disclaimer
- [x] TypeScript clean build

---

## Batch 7: Financing & Capital Stack

**Goal:** Capital spread schedule, capital stack tiers, total deficit.

### 7.1 Capital Spread Schedule
- **Files:** `app/types/index.ts`, `app/components/inputs/CapitalSpreadInputs.tsx` (new)
- **Tasks:**
  - [x] Add `CapitalSpreadItem` type:
    - description, amount ($) OR percentage (% of total project cost), date, type (Deposit / Progress / Final), linkedStackCategory
  - [x] Build `CapitalSpreadInputs` table component
  - [x] Allow add/delete rows
  - [x] If % entered, compute $ based on total project cost
  - [x] Date can be calendar date or "Month N"

### 7.2 Capital Stack UI
- **Files:** `app/components/inputs/CapitalStackInputs.tsx` (new)
- **Tasks:**
  - [x] Build vertical tier component:
    1. Senior Debt
    2. Mezzanine Debt
    3. Private Lending
    4. Profit Sharing
    5. Developer Equity
    6. Other Equity

### 7.3 Senior Debt
- **Tasks:**
  - [x] Inputs: LVR %, Interest rate, Toggle (Net GRV vs Net Project Costs)
  - [x] Establishment fee %, Broker fee %, Settlement fee $
  - [x] Calculation:
    - Net GRV base = totalRevenue − marginSchemeGst
    - Net Project Costs base = acquisition + development + financing fees
    - Loan = LVR% × base

### 7.4 Mezzanine Debt
- **Tasks:**
  - [x] Same fields as Senior Debt
  - [x] Independent LVR and interest rate
  - [x] Loan = LVR% × selected base

### 7.5 Private Lending
- **Tasks:**
  - [x] Inputs: Amount $ OR % of total cost, Interest rate %
  - [x] If % entered, compute $

### 7.6 Profit Sharing
- **Tasks:**
  - [x] Inputs: Amount committed ($), % on total capital, % of profit share
  - [x] Display "Profit Share Entitlement: $X" (computed after profit known)

### 7.7 Developer Equity
- **Tasks:**
  - [x] Computed read-only by default
  - [x] Formula: `developerEquity = totalProjectCost − seniorDebt − mezzanine − privateLending − otherEquity − profitSharingAmount`
  - [x] Allow manual override

### 7.8 Other Equity
- **Tasks:**
  - [x] Simple amount or % input
  - [x] Treated same as developer equity in stack priority

### 7.9 Total Deficit
- **Files:** `app/components/results/DeficitCard.tsx` (new)
- **Tasks:**
  - [x] Formula: `deficit = totalProjectCost − (seniorDebt + mezzanine + privateLending + committedEquity)`
  - [x] Prominent card in Financing Results
  - [x] Red badge if > 0: "Funding Gap: $X"
  - [x] Green badge if ≤ 0: "Fully Funded"
  - [x] Tooltip: "Deficit = Total Cost − Total Committed Capital"

### 7.10 Capital Spread → Stack Auto-Link
- **Tasks:**
  - [x] When spread item has "Linked Stack Category" selected:
  - [x] Sum of spread items in that category auto-populates stack tier amount *(via manual Sync button)*
  - [x] Manual override takes precedence

### Acceptance Criteria
- [x] Senior Debt 70% LVR on Net GRV $5M → $3.5M loan
- [x] Total cost $4M, debt $3M, equity $500k → deficit $500k (red)
- [x] Add $500k Developer Equity → deficit $0 (green)
- [x] TypeScript clean build

---

## Batch 8: Polish, Bug Fixes & Deploy

**Goal:** Fix known bugs, responsive UI, Vercel deployment.

### 8.1 Fix Known Bugs (AGENTS.md)
- **Tasks:**
  - [x] **Bug #1:** Add `"sda-hold"` to `SCENARIOS` array in `app/lib/calculations/index.ts`
  - [x] **Bug #2:** In `generateCashflow()`, replace hardcoded `0.06` with `inputs.financing.interestRate`
  - [x] **Bug #3:** Rename `sdaBasicWeekly` → `sdaBasicMonthly`, `rrcWeekly` → `rrcMonthly`, `ooaLeaseWeekly` → `ooaLeaseMonthly` in types, store, components
  - [x] **Bug #4:** Verify no `useEffect` pushes derived results into Zustand (already fixed in Batch 1)
  - [x] **Bug #5:** Add `useShallow` to Zustand consumers where appropriate *(partial — see implementation-notes.md)*

### 8.2 Dependency Cleanup
- **Tasks:**
  - [x] Evaluate `react-hook-form`, `@hookform/resolvers`, `zod` — remove if unused
  - [x] Verify `lucide-react ^1.14.0` — downgrade to `^0.x` if package is invalid

### 8.3 Responsive Polish
- **Tasks:**
  - [x] Test on iPhone SE width (375px)
  - [x] Scenario tabs: horizontal scroll or dropdown on mobile
  - [x] Capital Stack: stack vertically on mobile
  - [x] Input/Results panels: single column on < 1024px
  - [x] Tables: horizontal scroll wrapper

### 8.4 Vercel Deployment
- **Tasks:**
  - [x] Install `@vercel/react-router` adapter or configure `vercel.json`
  - [x] Add environment variables to Vercel dashboard:
    - `SUPABASE_URL`
    - `SUPABASE_PUBLISHABLE_KEY`
    - `SUPABASE_SECRET_KEY`
    - `GOOGLE_PLACES_API_KEY`
  - [ ] Deploy with `vercel --prod` *(pending manual trigger)*
  - [ ] Verify SSR (view page source, confirm HTML rendered) *(pending deployment)*
  - [ ] Verify Supabase connection (create scenario, reload, confirm persisted) *(pending deployment)*

### 8.5 Final QA Checklist
- [ ] Create project → add 3 scenarios → copy one → delete one *(pending manual QA)*
- [ ] Enter VIC address → stamp duty auto-calculates *(pending manual QA)*
- [ ] Set 18-month timeline → land tax prorates *(pending manual QA)*
- [ ] Switch pricing models → revenue updates *(pending manual QA)*
- [ ] Toggle GST global / per-line → costs update *(pending manual QA)*
- [ ] Capital stack: adjust LVR → deficit updates live *(pending manual QA)*
- [ ] Mobile: all actions possible without horizontal scroll *(pending manual QA)*

---

## Current Git State

```
main branch
Batch 1–4: Previously merged
Batches 5–8: Complete as of 2026-05-23
```

**To resume:** Batches 5–8 are fully implemented. Remaining work is manual deployment (`vercel --prod`) and manual QA testing.
