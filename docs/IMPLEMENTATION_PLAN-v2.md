# Fease-it: Implementation Plan v2.0

## Objective

Execute the PRD-v2 requirements in 8 discrete batches. Each batch is designed to be independently testable and deployable.

---

## Pre-Requisites

- [ ] Node.js 22+ and pnpm installed
- [ ] Supabase account created (free tier)
- [ ] Vercel account created (hobby tier)
- [ ] Google Cloud project with Places API enabled (or Australia Post API key)

---

## Batch 1: Infrastructure & Foundation

**Theme:** Database, Auth, Project/Scenario Architecture  
**Estimated Duration:** 2–3 days  
**Acceptance Criteria:** App loads scenarios from Supabase; data persists across sessions.

### 1.1 Supabase Setup

- [ ] Create new Supabase project.
- [ ] Run SQL schema from PRD-v2 §5.1 (projects + scenarios tables + RLS).
- [ ] Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `.env`.
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to `.env` (server-side only, never bundled to client).

### 1.2 React Router + Supabase Integration

- [ ] Install `@supabase/supabase-js`.
- [ ] Create `app/lib/supabase/client.ts` (browser client).
- [ ] Create `app/lib/supabase/server.ts` (server client with service role).
- [ ] Update `app/root.tsx` to provide Supabase context.

### 1.3 Auth Layer

- [ ] Implement anonymous sign-in on first visit (or magic link if preferred).
- [ ] Store `user_id` in Zustand / context.
- [ ] Protect loaders: redirect unauthenticated users to sign-in.

### 1.4 Data Service Layer

- [ ] Create `app/services/projectService.ts`:
  - `getProjects(userId)`
  - `createProject(name, userId)`
  - `deleteProject(id)`
- [ ] Create `app/services/scenarioService.ts`:
  - `getScenarios(projectId)`
  - `createScenario(projectId, data, sortOrder)`
  - `updateScenario(id, data)`
  - `deleteScenario(id)`
  - `duplicateScenario(id, overrides)`

### 1.5 Zustand Refactor

- [ ] Replace single `inputs: FeasibilityInputs` with:

  ```ts
  interface FeasibilityState {
    projectId: string | null;
    scenarios: Scenario[];
    activeScenarioId: string | null;
    isLoading: boolean;
    // actions...
  }
  ```

- [ ] Remove `setResults` action (fix AGENTS.md bug #4).
- [ ] Add `useShallow` selectors for all consumers (fix AGENTS.md bug #5).
- [ ] Keep localStorage as **offline cache only** (not primary store).

### 1.6 Pages & Routing

- [ ] Create `/projects` route: list user's projects, create new project.
- [ ] Update `/` (home) route to require `projectId` param (e.g., `/project/:projectId`).
- [ ] In home route `loader`: fetch scenarios from Supabase for the project.
- [ ] In home route `action`: debounced save scenario to Supabase.

### 1.7 Testing

- [ ] Create project → appears in list.
- [ ] Add scenario → persists after reload.
- [ ] Delete scenario → removed from DB.
- [ ] Open incognito window → data not visible ( confirms RLS works).

---

## Batch 2: Property Intelligence & Tax Automation

**Theme:** Address, Stamp Duty, Land Tax, Timeline  
**Estimated Duration:** 1–2 days  
**Acceptance Criteria:** Enter address → state detected → stamp duty & land tax auto-populated.

### 2.1 Address Finder

- [ ] Add Google Places Script loader or server-side geocoding.
- [ ] Build `AddressAutocomplete` component in `app/components/inputs/`.
- [ ] On select, parse `address_components` to extract: street, suburb, postcode, state.
- [ ] Auto-populate `property.state`, `property.suburb`, `property.postcode`.
- [ ] Fallback: manual state dropdown.

### 2.2 Stamp Duty Integration

- [ ] Import existing `calculateStampDuty(state, price)`.
- [ ] Auto-calculate when `property.state` or `property.purchasePrice` changes.
- [ ] Add stamp duty as first item in `acquisition_costs` array (overrideable).
- [ ] Show "Auto-calculated" badge; allow user to edit amount.

### 2.3 Land Tax Integration

- [ ] Import `calculateLandTax(state, landValue, isTrust)` from `app/lib/constants/landTax.ts`.
- [ ] Add "Land Tax" line item to Development Costs (auto-calculated).
- [ ] Input for unimproved land value (site value) — default to purchase price or user input.
- [ ] Prorate by `development.timelineMonths / 12`.

### 2.4 Project Timeline Section

- [ ] Build `TimelineInputs` component:
  - Settlement date (date input)
  - Contract date (date input)
  - Number of months (number input)
- [ ] Use timeline months to prorate:
  - Land tax
  - Council costs
  - Holding costs
- [ ] Display computed annual vs total land tax.

### 2.5 Testing

- [ ] VIC address → stamp duty matches `stampDuty.ts` output.
- [ ] NSW $1.5M property → land tax ≈ $6,900/year (general owner).
- [ ] Change timeline from 12 → 24 months → land tax doubles.

---

## Batch 3: Scenario Management

**Theme:** CRUD, Copy, Rename, Limit, Comparison  
**Estimated Duration:** 2 days  
**Acceptance Criteria:** Manage up to 20 scenarios; copy property+acquisition; compare scenarios.

### 3.1 Scenario Tabs UI

- [ ] Build `ScenarioTabs` component with horizontal scroll if needed.
- [ ] Each tab shows scenario name (inline editable on double-click).
- [ ] Active tab highlighted.
- [ ] "×" to delete (confirm dialog).

### 3.2 Add Scenario Flow

- [ ] "+ Add Scenario" button.
- [ ] Modal: "Create New Scenario".
  - Name input (default "Scenario {n+1}").
  - "Copy from:" dropdown (existing scenarios + "Blank").
  - Checkboxes for what to copy:
    - [x] Property Info & Acquisition Costs (locked on)
    - [ ] Development Strategy
    - [ ] Development Costs
    - [ ] Financing
    - [ ] Revenue
- [ ] On confirm: create in Supabase, add to Zustand, switch to new scenario.

### 3.3 20-Scenario Limit

- [ ] Disable "+ Add" button when `scenarios.length >= 20`.
- [ ] Show tooltip: "Maximum 20 scenarios reached. Delete one to add another."

### 3.4 Cross-Scenario Comparison

- [ ] New results component: `ScenarioComparisonTable`.
- [ ] Select 2–4 scenarios to compare.
- [ ] Metrics: Profit, Margin, Cash Required, Total Deficit, IRR.
- [ ] Highlight best value in each row.

### 3.5 Testing

- [ ] Add 20 scenarios → 21st is blocked.
- [ ] Copy Scenario A → new scenario has same property & acquisition costs.
- [ ] Delete scenario → tab disappears, next tab becomes active.

---

## Batch 4: Development Strategy & Sale Pricing

**Theme:** Strategy Dropdown + 4 Pricing Models + Stress Test  
**Estimated Duration:** 3 days  
**Acceptance Criteria:** All pricing models compute correct revenue; stress test shows range.

### 4.1 Development Strategy Dropdown

- [ ] Create `DevelopmentStrategyInputs` component.
- [ ] Dropdown options:
  - Sub-division
  - Townhouse Development
  - Apartments / Units
  - Single House(s)
- [ ] Each selection may show contextual helper text (e.g., "Sub-division: selling vacant land lots").

### 4.2 Lot Configuration Builder

- [ ] Number of lots input.
- [ ] "Generate Lots" button: creates `LotConfig[]` array with default names ("Lot 1", "Lot 2"...).
- [ ] Editable table: Lot Name, Area (sqm), Build Area (sqm), Is Held.

### 4.3 Pricing Model: Average Price / Lot

- [ ] Single input: "Average Sale Price per Lot".
- [ ] All lots inherit this price.

### 4.4 Pricing Model: Individual Price

- [ ] Per-lot "Sale Price" column in lot table.
- [ ] Each lot has independent price.

### 4.5 Pricing Model: Group Average by Lot Size

- [ ] "Add Group" button.
- [ ] Each group: size range (min sqm, max sqm) + price per lot.
- [ ] Auto-assign lots to groups based on size.
- [ ] Show group summary: "3 lots @ $1.2M each".

### 4.6 Pricing Model: Income / sqm

- [ ] Input: "$ per sqm".
- [ ] Each lot price = `$ per sqm × lotAreaSqm`.
- [ ] Display computed price per lot as read-only.

### 4.7 Stress Test (Min / Max Lots)

- [ ] Inputs: "Minimum Lots", "Maximum Lots".
- [ ] When both provided, calculate:
  - Best case profit (max lots × avg price)
  - Worst case profit (min lots × avg price)
- [ ] Display profit range in Summary Cards.

### 4.8 Calculation Engine Updates

- [ ] Update `calculateProfit` to use scenario's `developmentStrategy` and `pricingModel`.
- [ ] Total revenue = sum of all lot sale prices (respecting pricing model).

### 4.9 Testing

- [ ] 5 lots, avg $1M → total revenue $5M.
- [ ] 2 lots @ 500sqm ($2k/sqm = $1M), 3 lots @ 1000sqm ($1.5k/sqm = $1.5M) → total $6.5M.
- [ ] Min 3 lots, Max 5 lots, avg $1M → profit range shows 3× vs 5×.

---

## Batch 5: Development Costs & GST Overhaul

**Theme:** New Costs, GST Toggles, %→$ Display  
**Estimated Duration:** 2–3 days  
**Acceptance Criteria:** GST correctly applied; all % inputs show $; operating reserve removed.

### 5.1 Remove Operating Reserve & Repairs

- [ ] Remove `operatingReserve` from `DevelopmentInputs` type.
- [ ] Remove from `createDefaultInputs()`.
- [ ] Remove from `CostBreakdown` type and profit calculations.
- [ ] Remove from UI components.

### 5.2 New Global Cost Items

- [ ] Add to `DevelopmentCostItem` defaults:
  - Land Surveying
  - Utilities — Water
  - Utilities — Electricity
  - Council Costs
- [ ] Update `createDefaultInputs()` to include these at $0.

### 5.3 Contingency Default Change

- [ ] Change `contingencyPercent` default from `2` → `5`.

### 5.4 GST Toggle Per Line Item

- [ ] Extend `DevelopmentCostItem` and `AcquisitionCostItem`:

  ```ts
  gstTreatment: "free" | "inclusive" | "exclusive";
  ```

- [ ] Build `GSTToggle` mini-component (3-segment toggle: Free | Inc | Exc).
- [ ] Add toggle to every cost line item in UI.
- [ ] Default logic:
  - Government items (stamp duty, land tax, council): `free`
  - Utilities (water, electricity): `free`
  - All others: `inclusive`

### 5.5 Global GST Toggle

- [ ] Add `gstGlobalTreatment: "inclusive" | "exclusive"` to `DevelopmentInputs`.
- [ ] When toggled, bulk-update all line items' `gstTreatment` (except `free` items).
- [ ] Display global toggle at top of Development Costs section.

### 5.6 GST Calculation Engine

- [ ] Update profit/cost calculations:
  - `inclusive`: amount includes GST; GST component = amount − (amount / 1.1)
  - `exclusive`: amount excludes GST; total = amount × 1.1
  - `free`: total = amount; GST = 0
- [ ] Display total GST payable and GST-free total separately in results.

### 5.7 % → $ Display Component

- [ ] Build `ComputedDollarDisplay` component.
- [ ] Props: `percentage`, `baseAmount`, `label?`.
- [ ] Shows "≈ $X" computed in real time.
- [ ] Style: muted text, small font, right-aligned.

### 5.8 Apply %→$ Everywhere

- [ ] Stamp duty % → computed $ (base: purchase price).
- [ ] Town planning % → computed $ (base: total revenue).
- [ ] Building permits % → computed $.
- [ ] Holding cost % → computed $.
- [ ] Contingency % → computed $ (base: total dev cost).
- [ ] Marketing % → computed $ (base: total revenue).
- [ ] Financing fees % → computed $ (base: loan amount).
- [ ] Sales commission % → computed $ (base: total revenue).
- [ ] LVR % → computed $ (base: property value or net GRV/costs).

### 5.9 Testing

- [ ] Contingency 5% on $1M dev cost → shows ≈ $50,000.
- [ ] Toggle global to Exclusive → inclusive items increase by 10%.
- [ ] Council costs remain GST-free when global toggled.

---

## Batch 6: Revenue, Tax & Commissions

**Theme:** GST Margin Scheme Toggle, CGT, Sales Commission  
**Estimated Duration:** 1–2 days  
**Acceptance Criteria:** Revenue calculations include all tax and commission logic.

### 6.1 GST Margin Scheme Toggle

- [ ] In Revenue section, add toggle: "Apply Margin Scheme" (on/off).
- [ ] When ON:
  - GST per lot = 10% × (salePrice − costBasePerLot).
  - Cost base defaults to `purchasePrice / numLots`.
  - Allow override of cost base per lot.
- [ ] When OFF:
  - Use selected GST treatment (full GST, GST-free, etc.).
- [ ] Display "Margin Scheme GST: $X" prominently.

### 6.2 CGT Calculation

- [ ] Add `cgtEstimate` to results (informational, not deducted from profit).
- [ ] Formula:
  - If hold period > 12 months and owner type = individual/trust:
    - `cgt = (salePrice − costBase) × 0.5 × marginalRate` (assume 45% max → effective 22.5%).
  - Else: `cgt = (salePrice − costBase) × marginalRate`.
- [ ] Simplify for MVP: show "Estimated Tax Liability: $X (assumes 45% marginal rate; 50% discount applied if held > 12 months)".
- [ ] Add disclaimer tooltip: "Consult your accountant. Development profits may be treated as ordinary income."

### 6.3 Sales Commission

- [ ] Add to Revenue section:
  - Toggle: "% based" vs "Flat fee".
  - % based: input (default 1.5%), computed $ shown.
  - Flat fee: input $.
- [ ] Add commission to total costs in profit calculation.
- [ ] Display in results: "Sales Commission: $X".

### 6.4 Testing

- [ ] Margin scheme ON: purchase $2M, 2 lots, sale $1.75M each → GST = $37,000 total.
- [ ] Margin scheme OFF, full GST → GST = $350,000 total.
- [ ] Commission 1.5% on $3.5M revenue → $52,500.

---

## Batch 7: Financing & Capital Stack

**Theme:** Capital Spread, Capital Stack Tiers, Total Deficit  
**Estimated Duration:** 3–4 days  
**Acceptance Criteria:** Capital stack balances; deficit updates in real time.

### 7.1 Capital Spread Schedule

- [ ] Build `CapitalSpreadInputs` component (table format).
- [ ] Columns: Description, Amount / %, Date, Type (Deposit / Progress / Final), Linked Stack Category.
- [ ] Allow add/delete rows.
- [ ] If % entered, compute $ based on total project cost.
- [ ] Date can be calendar date or "Month N" relative to project start.

### 7.2 Capital Stack UI

- [ ] Build `CapitalStackInputs` component (vertical tiers).
- [ ] Tiers in order:
  1. Senior Debt
  2. Mezzanine Debt
  3. Private Lending
  4. Profit Sharing
  5. Developer Equity
  6. Other Equity

### 7.3 Senior Debt

- [ ] Inputs:
  - LVR %
  - Interest rate %
  - Toggle: Base = Net GRV OR Net Project Costs
  - Establishment fee %
  - Broker fee %
  - Settlement fee $
- [ ] Calculation:
  - If Net GRV: base = totalRevenue − marginSchemeGst.
  - If Net Project Costs: base = acquisition + development + financing fees.
  - Loan = LVR% × base.

### 7.4 Mezzanine Debt

- [ ] Same fields as Senior Debt.
- [ ] Independent LVR and interest rate.
- [ ] Loan = LVR% × same selected base.

### 7.5 Private Lending

- [ ] Inputs:
  - Amount $ OR % of total cost
  - Interest rate %
- [ ] If % entered, compute $.

### 7.6 Profit Sharing

- [ ] Inputs:
  - Amount committed ($)
  - % on total capital involved (profit share)
  - % of total profit they receive
- [ ] Display "Profit Share Entitlement: $X" (computed after profit is known).

### 7.7 Developer Equity

- [ ] Computed field (read-only by default).
- [ ] Formula:

  ```
  developerEquity = totalProjectCost
                    − seniorDebt
                    − mezzanineDebt
                    − privateLending
                    − otherEquity
                    − profitSharingAmount
  ```

- [ ] Allow manual override if developer injects more than minimum.

### 7.8 Other Equity

- [ ] Simple amount or % input.
- [ ] Treated same as developer equity in stack priority.

### 7.9 Total Deficit

- [ ] Display prominent card in Financing Results.
- [ ] Formula:

  ```
  deficit = totalProjectCost
            − (seniorDebt + mezzanine + privateLending + committedEquity)
  ```

- [ ] If deficit > 0: red badge "Funding Gap: $X".
- [ ] If deficit ≤ 0: green badge "Fully Funded".
- [ ] Tooltip: "Deficit = Total Cost − Total Committed Capital".

### 7.10 Capital Spread → Stack Auto-Link

- [ ] When capital spread item has "Linked Stack Category" selected:
  - Sum of spread items in that category auto-populates the stack tier amount.
  - User can still override stack tier (manual takes precedence).

### 7.11 Testing

- [ ] Senior Debt 70% LVR on Net GRV $5M → $3.5M loan.
- [ ] Total cost $4M, debt $3M, equity $500k → deficit $500k (red).
- [ ] Add $500k Developer Equity → deficit $0 (green).

---

## Batch 8: Polish, Bug Fixes & Deploy

**Theme:** Known bug fixes, responsive UI, Vercel deployment  
**Estimated Duration:** 2–3 days  
**Acceptance Criteria:** Production deploy; all known bugs resolved; mobile usable.

### 8.1 Fix Known Bugs (AGENTS.md)

- [ ] **Bug #1:** Add `"sda-hold"` to `SCENARIOS` array in `app/lib/calculations/index.ts`.
- [ ] **Bug #2:** In `generateCashflow()`, replace hardcoded `0.06` with `inputs.financing.interestRate`.
- [ ] **Bug #3:** Rename `sdaBasicWeekly` → `sdaBasicMonthly`, `rrcWeekly` → `rrcMonthly`, `ooaLeaseWeekly` → `ooaLeaseMonthly` in types, store, and components.
- [ ] **Bug #4:** Remove `useEffect` that pushes derived results into Zustand in `home.tsx`. Compute results in selectors or directly in component render.
- [ ] **Bug #5:** Add `useShallow` to all Zustand consumers or refactor to granular selectors.

### 8.2 Dependency Cleanup

- [ ] Evaluate `react-hook-form`, `@hookform/resolvers`, `zod`.
- [ ] If unused after all batches, remove from `package.json`.
- [ ] Verify `lucide-react ^1.14.0` — if package is invalid/squatted, downgrade to `^0.x` or replace with heroicons.

### 8.3 Responsive Polish

- [ ] Test on iPhone SE width (375px).
- [ ] Scenario tabs: horizontal scroll or collapsible dropdown on mobile.
- [ ] Capital Stack: stack vertically on mobile.
- [ ] Input/Results panels: single column on < 1024px.
- [ ] Tables: horizontal scroll wrapper.

### 8.4 Vercel Deployment

- [ ] Install `@vercel/react-router` adapter (if available) or configure `vercel.json` for SSR.
- [ ] Add environment variables to Vercel dashboard:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GOOGLE_PLACES_API_KEY` (if using)
- [ ] Run `vercel --prod` or push to Git → Vercel auto-deploy.
- [ ] Verify SSR works (view page source, confirm HTML rendered).
- [ ] Verify Supabase connection (create scenario, reload, confirm persisted).

### 8.5 Final QA Checklist

- [ ] Create project → add 3 scenarios → copy one → delete one.
- [ ] Enter VIC address → stamp duty auto-calculates.
- [ ] Set 18-month timeline → land tax prorates.
- [ ] Switch pricing models → revenue updates.
- [ ] Toggle GST global / per-line → costs update.
- [ ] Capital stack: adjust LVR → deficit updates live.
- [ ] Mobile: all actions possible without horizontal scroll.

---

## Execution Order Summary

```
Batch 1 ──► Batch 2 ──► Batch 3 ──► Batch 4 ──► Batch 5 ──► Batch 6 ──► Batch 7 ──► Batch 8
Infra       Property    Scenario    Dev Strategy  Costs & GST   Revenue      Financing    Deploy
            & Tax       Management  & Pricing                               & Stack
```

**Total Estimated Duration:** 2–3 weeks (1 developer, full-time).

**Recommended Pause Points:**

- After Batch 3: Core UX is usable; consider user feedback.
- After Batch 5: All cost/tax logic complete; good checkpoint for calculation accuracy audit.
- After Batch 7: Full financial model complete; ready for deploy polish.

---

*Document Status: Ready for execution.*
*Last Updated: 2026-05-12*
