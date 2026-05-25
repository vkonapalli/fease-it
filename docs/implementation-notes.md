# Fease-it Implementation Notes

> Running log of design decisions, trade-offs, and deviations from the original spec.

---

## Batch 5: Development Costs & GST Overhaul

### Decision: `ComputedDollarDisplay` lives in `app/components/ui/`
**Original spec:** "Files: `app/components/results/ComputedDollar.tsx` (new)"
**What we did:** Placed it in `app/components/ui/ComputedDollar.tsx` because it is a reusable UI primitive (shows "≈ $X" next to percentage inputs), not a result card. It is imported by input components across the app.

### Decision: Some `% → $` displays intentionally omitted
**Original spec:** Listed stamp duty, town planning, building permits, holding costs, marketing, financing fees, sales commission, LVR.
**What we did:**
- **Implemented:** Contingency, acquisition cost percentages, development global cost percentages, LVR, financing establishment/broker fees, sales commission.
- **Not implemented / not applicable:**
  - **Stamp duty** — Auto-calculated by state-based formula; not a user-editable percentage field.
  - **Town planning, building permits, marketing** — These do not exist as dedicated percentage fields in the current data model. They are either flat `$` global cost items or part of construction cost.
  - **Holding costs** — Operating cost percentages are `% of rent`, but total rent is a derived value not trivially available inside `OperatingInputs.tsx` without re-calculating revenue. Left as-is to avoid duplicating calculation logic in the UI layer.

### Decision: `GSTToggle` is a 3-segment inline button group
**Original spec:** "3-segment: Free | Inc | Exc"
**What we did:** Built as an inline-flex segmented control with color-coded active states (green/blue/amber) rather than a traditional toggle. This keeps it compact enough to fit on every cost row without wrapping.

---

## Batch 6: Revenue, Tax & Commissions

### Decision: CGT estimate embedded in `SummaryCards` instead of separate `TaxLiabilityCard.tsx`
**Original spec:** "Files: `app/components/results/SummaryCards.tsx` or new `TaxLiabilityCard.tsx`"
**What we did:** Added the CGT estimate directly into `SummaryCards` as a conditional card (lines 106–118). Creating a separate one-card component felt like unnecessary indirection when the SummaryCards component already houses all high-level metrics.

### Decision: Cost base for margin scheme defaults to `purchasePrice / numLots`
**Original spec:** "Cost base defaults to `purchasePrice / numLots`; allow override per lot"
**What we did:** Stored `costBasePerLot` as a single override in `GSTConfig` rather than per-lot. The UI exposes one editable field in `RevenueInputs`. If users need different cost bases per lot, they can model it by splitting into separate scenarios. This avoids complicating the `GSTConfig` type with an array.

---

## Batch 7: Financing & Capital Stack

### Decision: `CapitalStackInputs` defines its own `formatCurrency` helper
**Observation:** The component re-implements a 5-line `formatCurrency` at the bottom instead of importing from `~/lib/utils`. This was likely done during rapid iteration to avoid importing issues. It is harmless but should eventually be consolidated.

### Decision: `CapitalSpreadInputs` still uses `useInputSlice` shim
**Observation:** `CapitalSpreadInputs` uses the old `useFeasibilityStore` compatibility shim (`useInputSlice`) while `CapitalStackInputs` was migrated to `useAppStore` with `useShallow`. This means the spread component still triggers wider re-renders. A full migration was deprioritized because the component works correctly; performance can be addressed in a dedicated store-cleanup pass.

### Decision: Capital Stack tiers ordered by priority (Senior → Equity)
**Original spec:** Listed 1. Senior Debt, 2. Mezzanine, 3. Private Lending, 4. Profit Sharing, 5. Developer Equity, 6. Other Equity.
**What we did:** Rendered in exactly this order. Developer Equity is auto-computed by default (`isAutoComputed: true`) and can be switched to manual override. The formula used is `developerEquity = totalProjectCost − seniorDebt − mezzanine − privateLending − otherEquity − profitSharingAmount`.

### Decision: Auto-link is manual-sync, not real-time
**Original spec:** "Sum of spread items in that category auto-populates stack tier amount"
**What we did:** Implemented as a manual **Sync** button with a badge showing linked totals. Real-time auto-sync was avoided because it would overwrite manual user edits without an explicit action, creating a frustrating UX. The badge + sync button pattern gives users full control.

---

## Batch 8: Polish, Bug Fixes & Deploy

### Decision: No separate `vercel.json` needed
**Original spec:** "Install `@vercel/react-router` adapter or configure `vercel.json`"
**What we did:** Added `vercelPreset()` to `react-router.config.ts` and installed `@vercel/react-router` in dependencies. This is the canonical React Router v7 + Vercel integration; no `vercel.json` is required.

### Decision: Responsive layout already addressed in earlier iterations
**Observation:** The main layout (`project-detail.tsx`) uses `grid-cols-1 lg:grid-cols-2` which collapses to a single column on mobile. All tables (`CashflowTable`, `ComparisonTable`, `YearlyProjectionTable`, `BudgetVsActualTable`) already wrap in `overflow-x-auto` containers. Scenario tabs use `overflow-x-auto`. No additional responsive work was needed for Batch 8.

### Decision: `zod` kept in dependencies
**Original spec:** "Evaluate `react-hook-form`, `@hookform/resolvers`, `zod` — remove if unused"
**What we did:** Removed `react-hook-form` and `@hookform/resolvers`. Kept `zod` (v4.4.3) because it is now used by the AI chat layer for structured output parsing with `@ai-sdk/react`.

---

## General Architecture Notes

### Mixed store consumption patterns
- **Modern pattern:** `useAppStore` with `useShallow` (e.g., `CapitalStackInputs`, `RevenueInputs`, `FinancingInputs`).
- **Legacy pattern:** `useInputSlice` from the `feasibilityStore` shim (e.g., `DevelopmentInputs`, `CapitalSpreadInputs`, `OperatingInputs`).
- **Impact:** Components using `useInputSlice` re-render on any input change across the whole scenario. This is a known performance debt documented in `AGENTS.md` Bug #5.

### SSR routing architecture
- The app uses React Router v7 framework mode with `ssr: true`.
- Project and scenario IDs are reflected in the URL (`/projects/:projectId/scenarios/:scenarioId`).
- The server renders the shell; auth guard and data fetching happen client-side via `useEffect`. This is intentional because Supabase auth requires the browser environment.

### AI Chat integration
- Added in commits after Batch 4 (not covered by BATCHES-5-8.md).
- Uses `@ai-sdk/react` with `@ai-sdk/openai` and `@ai-sdk/moonshotai`.
- Tool calling is enabled with logging and a code interpreter.
- Conversation persistence was extracted into a local workspace package `@fease-it/convo`.

---

*Last updated: 2026-05-23*
