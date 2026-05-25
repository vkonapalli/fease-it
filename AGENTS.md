# AGENTS.md — Fease-It

## Stack & Framework

- **React Router v7** in framework mode with SSR (`ssr: true` in `react-router.config.ts`). This is a full-stack framework, not a plain SPA.
- **React 19**, **TypeScript 5.9**, **Tailwind CSS v4** (via `@tailwindcss/vite`).
- **Vite** is the build tool; path alias `~/*` maps to `./app/*`.
- State management via **Zustand** (`app/stores/feasibilityStore.ts`) with `localStorage` persistence.
- Charting via **visx** (`@visx/axis`, `@visx/shape`, `@visx/scale`, `@visx/responsive`, `@visx/tooltip`).

## Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start dev server on `http://localhost:5173` |
| `npm run build` | Production build (outputs `build/client` + `build/server`) |
| `npm run start` | Serve production build via `react-router-serve` |
| `npm run typecheck` | Generate route types (`react-router typegen`) then run `tsc` |

There is **no test runner, linter, or formatter** configured.

## Architecture

- **Routes**: `app/routes.ts` → `home.tsx` (main app), `projects.tsx` (project list), `settings.tsx` (strategy management), `login.tsx`.
- **Entry layout**: `app/root.tsx` supplies the HTML shell, fonts, and error boundary.
- **Inputs / Results split**:
  - Input components: `app/components/inputs/`
  - Result components: `app/components/results/`
  - Calculation engine: `app/lib/calculations/` (index, profit, financing, gst, sda)
  - Strategies: `app/lib/templates.ts`
  - Shared types: `app/types/index.ts`
- **Store**: `useAppStore` (Zustand) holds projects, scenarios, and custom strategies. Persisted to `localStorage` under `fease-it-storage-v3`. `useFeasibilityStore` is a compatibility shim reading the active scenario from `useAppStore`.

## Known Bugs / Code Quirks

### Resolved

1. ~~`"sda-hold"` missing from `SCENARIOS`~~ — Fixed. `"sda-hold"` is present in the `SCENARIOS` array in `app/lib/calculations/index.ts`.
2. ~~Cashflow interest hardcoded to 6 %~~ — Fixed. `generateCashflow()` receives `interestRate` as a parameter (fed from `inputs.financing.interestRate`).
3. ~~SDA field names say "weekly" but values are monthly~~ — Fixed. Fields are correctly named `sdaBasicMonthly`, `rrcMonthly`, `ooaLeaseMonthly` in `app/types/index.ts` and the UI label reads "Monthly per Unit".
4. ~~Derived results mirrored back into Zustand~~ — Fixed. `app/routes/home.tsx` computes results via `useMemo` and never writes them back to the store. `useFeasibilityStore` shim has `setResults` as a no-op.

### Still Present

5. **Components subscribe to the whole store**  
   `home.tsx` now uses granular selectors with `useAppStore`, but most input components still use the `useFeasibilityStore` compatibility shim which destructures the entire active scenario. This triggers re-renders in every consumer on any input change. Prefer migrating components to `useAppStore` with selectors or `useShallow`.

## Dependency Notes

- **`lucide-react ^0.468.0`** — verified legitimate package.
- ~~**Unused deps** installed but never imported: `react-hook-form`, `@hookform/resolvers`, `zod`~~ — Removed.

## Conventions

- Use the `~/*` import alias for all app code (e.g., `~/components/...`, `~/lib/...`).
- Types and interfaces live in `app/types/index.ts` — do not add hardcoded business values there.
- Default input values (including strategy-specific templates) are set in `app/lib/templates.ts` inside `createBaseInputs()` and the strategy-specific creators. The store shim `app/stores/feasibilityStore.ts` is a compatibility layer.
