# Fease-it: Product Requirements Document (v2.0)

## Property Development Feasibility Platform — Major Feature Release

---

## 1. Executive Summary

**Product:** Fease-it — Australian property development feasibility calculator  
**Current State:** React Router v7 SSR app, Zustand state, localStorage persistence, single-page feasibility tool  
**Target State:** Multi-scenario, database-backed feasibility platform with automated Australian tax calculations, advanced financing modelling, and deployment-ready architecture.

**Deployment Target:** Vercel (requires persistent database; localStorage insufficient).

**MVP Priority:** All items in this document are MVP unless explicitly marked `[Post-MVP]`.

---

## 2. Requirements Analysis & Categorization

| Category | Requirements | Priority | Complexity |
|----------|-------------|----------|------------|
| **Infrastructure** | Migrate from localStorage to Supabase PostgreSQL; auth & project isolation | P0 | High |
| **Property Intelligence** | Address finder; automated stamp duty by state; automated land tax by state | P0 | Medium |
| **Scenario Management** | Rename, add (max 20), delete, copy property + acquisition info across scenarios | P0 | Medium |
| **Development Strategy** | Sale strategy dropdown (sub-division, townhouse, apartments, single house); lot pricing models (avg, individual, group by lot size, $/sqm); stress-test min/max | P0 | High |
| **Development Costs** | Global per-scenario costs (land surveying, timeline, utilities); remove operating reserve & repairs; contingency default 5%; GST toggles (per line + global); government/utilities default GST-free; % values show $ equivalent | P0 | Medium |
| **Revenue & Tax** | GST margin scheme toggle; CGT calculation; sales commission (% or flat fee) | P0 | Medium |
| **Financing** | Capital spread schedule (deposit, amount, %, date, description); capital stack (senior debt LVR-based, mezzanine, private lending, profit sharing, developer equity); total deficit calculation | P0 | High |
| **UI/UX** | % inputs display computed dollar value alongside; responsive layout for new modules | P1 | Low |
| **[Post-MVP]** | Custom/Other development strategy; complex waterfall distributions; CoreLogic integration; PDF export | Post-MVP | High |

---

## 3. Architecture & Data Model

### 3.1 Database Recommendation

**Primary:** **Supabase** (PostgreSQL + Auth + Realtime)

- Free tier sufficient for MVP
- Works natively with serverless/edge (Vercel)
- Row Level Security (RLS) for multi-user isolation
- Can migrate to paid tier without code changes

**Alternative:** Turso (libSQL/SQLite) if user prefers SQLite semantics.

**Not recommended:** File-based SQLite (does not work on Vercel serverless).

### 3.2 Architecture Pattern

```
┌─────────────────────────────────────────┐
│  Vercel Edge / Serverless Functions     │
│  (React Router v7 SSR loaders/actions)  │
├─────────────────────────────────────────┤
│  Supabase Client (server + browser)     │
├─────────────────────────────────────────┤
│  PostgreSQL (feasibilities, scenarios)  │
└─────────────────────────────────────────┘
```

- **Server:** React Router `loader` functions read from Supabase via service role key (for RLS bypass where needed) or anon key with user JWT.
- **Client:** Zustand store persists optimistic UI state; mutations go through React Router `action` functions.
- **Auth:** Supabase Auth with anonymous sign-in (no password required for MVP) or magic link.

### 3.3 Core Entities

```
Project (1)
  └── Scenario (*, max 20)
        ├── property_inputs
        ├── acquisition_costs
        ├── development_strategy
        ├── development_costs
        ├── financing / capital_stack
        ├── revenue_inputs
        └── calculation_results (cached)
```

---

## 4. Module Specifications

---

### Module 1: Property & Address Intelligence

#### 1.1 Address Finder

- **Integration:** Google Places API (free tier: $200/mo credit covers typical usage) or Australia Post Address API.
- **Behavior:**
  - Autocomplete address input in Property Details section.
  - On select, parse into structured fields: street, suburb, postcode, state.
  - State field auto-populates and triggers stamp duty recalculation.
  - Store full formatted address string.
- **Fallback:** Manual address entry with state dropdown if API unavailable.

#### 1.2 Automated Stamp Duty

- **Trigger:** State selection or purchase price change.
- **Behavior:**
  - Use existing `app/lib/calculations/stampDuty.ts` formulas.
  - Apply **investment property rates** (no first-home concessions).
  - Display calculated stamp duty as a non-editable derived field in Acquisition Costs.
  - Allow user to override the auto-calculated value (e.g., for off-plan concessions).
- **Formula source:** Already implemented for all 8 states/territories.

#### 1.3 Automated Land Tax

- **Trigger:** State selection, land value input, or project timeline change.
- **Behavior:**
  - Use `app/lib/constants/landTax.ts` tiered formulas.
  - Calculate annual land tax based on unimproved land value (site value).
  - Prorate by project timeline (e.g., 18-month project = 1.5 × annual tax).
  - Add land tax as a line item in Development Costs under "Holding / Timeline Costs".
  - Allow override.
- **Data maintenance:** Land tax brackets stored in `landTax.ts`; update annually.

#### 1.4 Project Timeline

- **Inputs:**
  - Settlement date (date picker)
  - Contract date (date picker)
  - Number of months (total project duration)
- **Derived:**
  - Land tax auto-populated based on state × months / 12.
  - Funding costs (interest) calculated across the timeline.
  - Council costs may vary by timeline (user-editable).

---

### Module 2: Scenario Management

#### 2.1 Scenario CRUD

- **Add Scenario:**
  - Button: "+ Add Scenario" (disabled when 20 scenarios exist).
  - Prompt: "Copy from existing scenario?" with dropdown of current scenarios.
  - **Must copy:** Property info + Acquisition costs.
  - **Optionally copy:** Development strategy, Development costs, Financing settings, Revenue settings.
  - New scenario gets default name: "Scenario {n}" (editable inline).
- **Rename Scenario:** Inline edit on scenario tab/header.
- **Delete Scenario:** Confirm dialog. Cannot delete if only 1 scenario remains.
- **Limit:** Hard-enforced 20 scenario maximum.

#### 2.2 Scenario State Architecture

- Replace single `inputs` in Zustand with `scenarios: Scenario[]` and `activeScenarioId: string`.
- Each scenario contains its own complete input set.
- Results computed per-scenario on demand (not mirrored back to store; fix AGENTS.md bug #4).

#### 2.3 Scenario Comparison

- Existing comparison table extended to compare selected scenarios side-by-side (not just LVRs).
- Metrics: Profit, Margin, Cash Required, IRR, Total Deficit.

---

### Module 3: Development Strategy & Sale Pricing

#### 3.1 Development Strategy Dropdown

- **Location:** New section "Development Strategy" above Development Costs.
- **Options (MVP):**
  1. **Sub-division** (land only, create lots)
  2. **Townhouse Development**
  3. **Apartments / Units**
  4. **Single House(s)**
- **[Post-MVP]:** Custom / Other (excluded from MVP per user request).

#### 3.2 Sale Price / Strategy Sub-Module

This module appears for **all** development strategies.  
*"Sale strategy can be repeated for all, same as the sub-division one."*

**Pricing Models (user-selectable per scenario):**

| Model | Description | Inputs |
|-------|-------------|--------|
| **Average Price / Lot** | Single price applied to all lots | Average $ per lot |
| **Individual Price** | Per-lot price table | Price for each lot |
| **Group Average (by Lot Size)** | Lots grouped by size range, each group has avg price | Size ranges (e.g., 500 sqm, 1000 sqm) + price per group |
| **Income / sqm** | Price derived from $/sqm × lot area | $ per sqm |

**Stress Test:**

- Min/Max toggles for number of lots.
- When min/max entered, show profit range (best case / worst case).
- Sensitivity table updated to reflect lot count variation.

#### 3.3 Lot Configuration

- Keep existing `LotConfig[]` structure but enhance:
  - Add `lotSizeSqm` (explicit, separate from `landAreaSqm`).
  - Group lots by size for "Group Average" pricing.
  - Stress-test boundaries stored as `minLots` / `maxLots` on scenario.

---

### Module 4: Global Development Costs

#### 4.1 New Cost Categories

Per-scenario global development costs (replace / extend current `globalCosts`):

| Cost Item | Type | Default | GST Treatment |
|-----------|------|---------|---------------|
| Land Surveying | $ | 0 | Inclusive |
| Project Timeline / Holding | months + $ | 12 months | Inclusive |
| Land Tax | $ (auto) | Calculated | Free |
| Utilities — Water | $ | 0 | Free |
| Utilities — Electricity | $ | 0 | Free |
| Council Costs | $ | 0 | Free |
| Contingency | % | 5% | Inclusive |

**Removed from MVP:** Operating Reserve & Repairs (user explicitly requested removal).

#### 4.2 GST Handling

- **Global Toggle:** "All costs GST Inclusive / Exclusive" (default: Inclusive).
- **Per-Line Toggle:** Each cost item has individual toggle: GST Free / Inclusive / Exclusive.
- **Defaults:**
  - Government charges (stamp duty, land tax, council costs): **GST Free**
  - Utilities (water, electricity): **GST Free**
  - All other costs: **GST Inclusive**
- **Calculation:**
  - If GST Inclusive: stored amount includes GST. Display GST component separately.
  - If GST Exclusive: stored amount excludes GST. Add 10% for total.
  - If GST Free: no GST applied.

#### 4.3 % Values Show Dollar Equivalent

- **Every percentage input** in the app must display its computed dollar value.
- Example: "Contingency 5%" → show "≈ $45,000" next to the input.
- Computed against contextual base (e.g., acquisition costs for stamp duty %, total dev cost for contingency %).

#### 4.4 Project Timeline Integration

- Timeline drives:
  - Land tax proration.
  - Funding cost (interest) duration.
  - Council rate proration.
- Display as Gantt-style or month-flow bar in results panel (simplified for MVP).

---

### Module 5: Revenue, Tax & Commissions

#### 5.1 GST on Revenue

- **GST Treatment Toggle:** Full GST / Margin Scheme / GST Free / Input Taxed / Going Concern (existing).
- **Margin Scheme:**
  - Available as a toggle (not always on).
  - When active, GST = 10% × (Sale Price − Cost Base per lot).
  - Cost base defaults to `purchasePrice / numLots`; allow override.
- Display GST payable per lot and total GST.

#### 5.2 Capital Gains Tax (CGT)

- **Trigger:** Hold scenarios or any scenario with held lots.
- **Calculation:**
  - If held > 12 months: 50% CGT discount applies (individual/trust).
  - CGT = (Sale Price − Cost Base) × applicable rate.
  - Show as separate line in results (not deducted from profit by default; informational).
- **Note:** For development-for-profit, ordinary income tax may apply rather than CGT. Display as "Potential CGT / Income Tax Liability — consult accountant."

#### 5.3 Sales Commission

- **Type Toggle:** Percentage based OR Standard (flat) fee.
- **Percentage:** Default 1.5% of total revenue.
- **Flat Fee:** Fixed $ amount.
- Added to total costs.

---

### Module 6: Financing & Capital Stack

#### 6.1 Capital Spread (Schedule)

- **Purpose:** Track capital injections/requirements at different points in time.
- **Fields per line item:**
  - Description (e.g., "Deposit", "Stage 1 Payment")
  - Amount ($) OR Percentage (% of total project cost)
  - Date (calendar date or "Month N")
  - Type: Deposit / Progress Payment / Final Payment
- **Interaction with Capital Stack:**
  - Each spread item must map to a capital stack category (Senior Debt, Mezzanine, Equity, etc.).
  - Sum of spread items by category = total committed in that category.

#### 6.2 Capital Stack

Complete overhaul of financing section.  
*"Other than LVR and mezzanine, everything else is equity."*

| Tier | Fields | Calculation Base |
|------|--------|------------------|
| **Senior Debt** | LVR %, Interest rate, Toggle: Net GRV vs Net Project Costs | LVR × (selected base) |
| **Mezzanine Debt** | Same as Senior Debt | LVR × (selected base) |
| **Private Lending** | Amount OR % of total cost, Interest rate | User input |
| **Profit Sharing** | Amount committed, % on total capital, % of profit share | User input |
| **Developer Equity** | Amount | Residual |
| **Other Equity** | Amount / % | User input |

**LVR Toggle Options:**

- **Net GRV:** Gross Realisation Value (revenue) minus Margin Scheme GST.
- **Net Project Costs:** Acquisition + Development Costs + Financing Fees + etc.

**Senior / Mezzanine Details:**

- Interest-only or compounded (toggle).
- Establishment fees (% of loan).
- Broker fees.
- Settlement fees.

#### 6.3 Total Deficit

- **Definition:** Total Project Cost − (Senior Debt + Mezzanine + Private Lending + Committed Equity).
- **Display:** Prominently shown in Financing results panel.
- **Update:** Real-time recalculation as capital stack changes.
- **Color coding:** Red if deficit > 0 (more equity needed), Green if ≤ 0 (fully funded).
- **Clarification note:** The deficit represents the gap that must be filled by additional equity (typically Developer Equity or new investors). If negative, the project is over-capitalised or has surplus.

---

### Module 7: UI/UX Enhancements

#### 7.1 Percentage → Dollar Display

- Every `%` input field shows computed `$` in real time.
- Placement: Below or to the right of input.
- Format: "≈ $45,000" in muted text.

#### 7.2 Responsive Layout for New Modules

- Development Strategy and Capital Stack will add significant vertical height.
- Use tabs or collapsible sections within the Input Panel.
- Consider accordion pattern: Property → Acquisition → Development Strategy → Development Costs → Financing → Revenue.

#### 7.3 Results Panel Updates

- New cards:
  - Total Deficit
  - GST Payable (with margin scheme indicator)
  - Land Tax (annual + total)
  - Sales Commission
  - CGT Estimate
- New tables:
  - Capital Spread Schedule
  - Capital Stack Breakdown

---

## 5. Database Schema (Supabase)

### 5.1 Tables

```sql
-- Users managed by Supabase Auth (no custom table needed for MVP)

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Project',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Scenario 1',
  sort_order INT NOT NULL DEFAULT 0,
  -- Property
  property JSONB NOT NULL DEFAULT '{}',
  -- Acquisition
  acquisition_costs JSONB NOT NULL DEFAULT '[]',
  -- Development Strategy
  development_strategy JSONB NOT NULL DEFAULT '{}',
  -- Development Costs
  development_costs JSONB NOT NULL DEFAULT '{}',
  -- Financing / Capital Stack
  financing JSONB NOT NULL DEFAULT '{}',
  -- Revenue
  revenue JSONB NOT NULL DEFAULT '{}',
  -- Operating (for hold scenarios)
  operating JSONB NOT NULL DEFAULT '{}',
  -- Cached results (optional, for speed)
  results JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD scenarios in own projects"
  ON scenarios FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );
```

### 5.2 JSONB Structures

Stored as JSONB to allow rapid iteration without schema migrations for nested fields:

- `property`: `{ purchasePrice, landArea, location, address, suburb, postcode, state }`
- `acquisition_costs`: `[ { id, name, amount, isPercentage, gstTreatment } ]`
- `development_strategy`: `{ strategyType, pricingModel, lots: [], minLots, maxLots }`
- `development_costs`: `{ globalCosts: [], timelineMonths, settlementDate, contractDate, contingencyPercent, gstGlobalTreatment }`
- `financing`: `{ capitalSpread: [], capitalStack: { seniorDebt, mezzanine, privateLending, profitSharing, developerEquity, otherEquity }, totalDeficit }`
- `revenue`: `{ gstTreatment, salesCommission, cgtEstimate }`

### 5.3 Migration Strategy

1. Keep Zustand for client-side optimistic UI state.
2. On load, fetch scenarios from Supabase via React Router `loader`.
3. On input change, debounce and call `action` to persist to Supabase.
4. On network failure, queue writes and retry (or fall back to localStorage as offline cache).

---

## 6. Batch Execution Plan

### Batch 1: Infrastructure & Foundation

**Goal:** Database layer, auth, project/scenario CRUD.

| # | Task | Est. Time |
|---|------|-----------|
| 1.1 | Set up Supabase project, create tables, configure RLS | 2h |
| 1.2 | Install Supabase client (`@supabase/supabase-js`), configure React Router loaders/actions | 2h |
| 1.3 | Implement anonymous auth (magic link or anon sign-in) | 1h |
| 1.4 | Create `projectService.ts` and `scenarioService.ts` data layer | 2h |
| 1.5 | Refactor Zustand store: `scenarios[]` + `activeScenarioId`; remove `setResults` anti-pattern | 2h |
| 1.6 | Create Project selector / dashboard page (list of projects) | 2h |

**Deliverable:** App loads from Supabase; user can create project with scenarios; data persists across reloads.

---

### Batch 2: Property Intelligence & Tax Automation

**Goal:** Address finder, stamp duty, land tax, timeline.

| # | Task | Est. Time |
|---|------|-----------|
| 2.1 | Integrate Google Places Autocomplete (or Australia Post) in Property Inputs | 2h |
| 2.2 | Wire stamp duty auto-calculation to state selection; allow override | 1h |
| 2.3 | Integrate `landTax.ts` constants; auto-calculate land tax by state × timeline | 2h |
| 2.4 | Add Project Timeline section: settlement date, contract date, months | 1h |
| 2.5 | Prorate land tax & council costs by timeline months | 1h |
| 2.6 | Display computed land tax in Development Costs | 1h |

**Deliverable:** Enter address → state auto-detected → stamp duty & land tax auto-populated.

---

### Batch 3: Scenario Management

**Goal:** Full scenario CRUD with copy and 20-limit.

| # | Task | Est. Time |
|---|------|-----------|
| 3.1 | Build Scenario Tabs component with add/rename/delete | 2h |
| 3.2 | Implement "Copy Scenario" dialog with checkboxes for what to copy | 2h |
| 3.3 | Enforce 20-scenario hard limit | 1h |
| 3.4 | Update calculation engine to accept per-scenario inputs (not global) | 2h |
| 3.5 | Scenario comparison table (cross-scenario, not just LVR) | 2h |

**Deliverable:** User can manage 1–20 scenarios, copy property+acquisition info, compare outcomes.

---

### Batch 4: Development Strategy & Sale Pricing

**Goal:** Strategy dropdown + all pricing models.

| # | Task | Est. Time |
|---|------|-----------|
| 4.1 | Create Development Strategy dropdown (sub-division, townhouse, apartments, single house) | 1h |
| 4.2 | Build Sale Pricing sub-module with 4 model toggles | 3h |
| 4.3 | Implement "Average Price / Lot" model | 1h |
| 4.4 | Implement "Individual Price" per-lot table | 1h |
| 4.5 | Implement "Group Average by Lot Size" model | 2h |
| 4.6 | Implement "Income / sqm" model | 1h |
| 4.7 | Add stress-test min/max lot inputs with profit-range display | 2h |
| 4.8 | Update profit/revenue calculations to respect pricing model | 2h |

**Deliverable:** All 4 pricing models functional; stress-test shows profit range.

---

### Batch 5: Development Costs & GST Overhaul

**Goal:** New cost categories, GST toggles, %→$ display.

| # | Task | Est. Time |
|---|------|-----------|
| 5.1 | Remove Operating Reserve & Repairs from defaults and UI | 1h |
| 5.2 | Add Land Surveying, Utilities (water/electricity), Council Costs to global costs | 1h |
| 5.3 | Change contingency default from 2% → 5% | 0.5h |
| 5.4 | Build GST toggle per cost line (Free / Inclusive / Exclusive) | 2h |
| 5.5 | Build global GST toggle (Inclusive / Exclusive) | 1h |
| 5.6 | Update cost calculation engine to factor GST treatment | 2h |
| 5.7 | Build "Computed $" display component for all % inputs | 2h |
| 5.8 | Apply computed-$ display across all relevant inputs | 2h |

**Deliverable:** GST-aware cost calculations; every % shows $ equivalent.

---

### Batch 6: Revenue, Tax & Commissions

**Goal:** GST margin scheme toggle, CGT, sales commission.

| # | Task | Est. Time |
|---|------|-----------|
| 6.1 | Add GST Margin Scheme toggle to Revenue section (on/off, not always active) | 1h |
| 6.2 | Update GST calculation to respect toggle state | 1h |
| 6.3 | Add CGT estimation panel (50% discount if held > 12 months) | 2h |
| 6.4 | Add Sales Commission input (% default 1.5% OR flat fee toggle) | 1h |
| 6.5 | Integrate commission into total costs | 1h |
| 6.6 | Update results cards: GST payable, CGT estimate, Commission | 1h |

**Deliverable:** Revenue section complete with all tax and commission logic.

---

### Batch 7: Financing & Capital Stack

**Goal:** Capital spread, capital stack tiers, total deficit.

| # | Task | Est. Time |
|---|------|-----------|
| 7.1 | Build Capital Spread table (description, amount/%, date, type) | 2h |
| 7.2 | Build Capital Stack UI: Senior Debt, Mezzanine, Private, Profit Share, Dev Equity, Other | 3h |
| 7.3 | Implement LVR toggle (Net GRV vs Net Project Costs) | 2h |
| 7.4 | Implement Senior Debt calculation (LVR × selected base) | 1h |
| 7.5 | Implement Mezzanine Debt calculation | 1h |
| 7.6 | Implement Private Lending (amount or %) | 1h |
| 7.7 | Implement Profit Sharing (capital committed + profit % share) | 1h |
| 7.8 | Implement Developer Equity = residual | 1h |
| 7.9 | Build Total Deficit display (real-time, color-coded) | 2h |
| 7.10 | Wire capital spread items to auto-populate capital stack categories | 2h |

**Deliverable:** Full financing module with deficit tracking.

---

### Batch 8: Polish, Bug Fixes & Deploy

**Goal:** Fix known issues, responsive polish, deploy.

| # | Task | Est. Time |
|---|------|-----------|
| 8.1 | Fix AGENTS.md bug #1: add `"sda-hold"` to `SCENARIOS` array | 0.5h |
| 8.2 | Fix AGENTS.md bug #2: cashflow interest uses `inputs.financing.interestRate` instead of hardcoded 6% | 0.5h |
| 8.3 | Fix AGENTS.md bug #3: rename `sdaBasicWeekly` → `sdaBasicMonthly` (and RRC/OOA) to match monthly values | 1h |
| 8.4 | Fix AGENTS.md bug #4: stop mirroring derived results into Zustand; compute in selectors | 2h |
| 8.5 | Fix AGENTS.md bug #5: add `useShallow` / granular selectors to store consumers | 2h |
| 8.6 | Remove unused deps (`react-hook-form`, `@hookform/resolvers`, `zod`) if still unused | 0.5h |
| 8.7 | Responsive pass: new modules on mobile (375px+) | 2h |
| 8.8 | Configure Vercel adapter for React Router v7 SSR | 2h |
| 8.9 | Deploy to Vercel, verify Supabase connection | 2h |

**Deliverable:** Production deployment on Vercel; all known bugs resolved.

---

## 7. Open Questions & Risks

| # | Question / Risk | Mitigation |
|---|-----------------|------------|
| 1 | **CGT accuracy:** Development-for-profit is usually ordinary income, not CGT. | Label as "Tax Liability Estimate (CGT or Income Tax)"; advise consulting accountant. |
| 2 | **Land tax formula accuracy:** Rates change annually and vary by ownership structure. | Store in dedicated constants file with clear "verify annually" comment; allow override. |
| 3 | **Vercel + React Router v7 SSR:** Need `@vercel/react-router` adapter or custom build. | Test early in Batch 1; fallback to SPA mode if SSR adapter proves problematic. |
| 4 | **Supabase free tier limits:** 500 MB database, 2 GB bandwidth. | Sufficient for MVP; JSONB storage is compact. Monitor usage. |
| 5 | **Address finder API cost:** Google Places $200/mo credit may exhaust with heavy use. | Implement debounce (300ms); add fallback to manual entry; consider Australia Post API. |
| 6 | **Total deficit definition:** Confirmed as gap between total costs and committed capital. | Display formula tooltip: `Deficit = Total Cost − (Debt + Committed Equity)`. |

---

## 8. Success Criteria

| Criterion | Target |
|-----------|--------|
| Time to create new scenario | < 10 seconds |
| Time to auto-calculate stamp duty + land tax | < 500 ms |
| Scenario limit enforcement | Hard stop at 20 |
| Total deficit recalculation latency | < 300 ms |
| Mobile usability (375 px) | All inputs accessible, no horizontal scroll |
| Vercel Lighthouse Performance | > 75 (acceptable for data-heavy app) |
| Calculation accuracy vs spreadsheet | 99% match on identical inputs |

---

## 9. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2025-05-11 | Venky | Initial PRD (Next.js / localStorage) |
| 2.0 | 2026-05-12 | Venky | Complete rewrite: React Router v7, Supabase, multi-scenario, tax automation, capital stack |

---

*Document Status: Ready for stakeholder review and batch execution.*
