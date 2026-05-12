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

- **Single route**: `app/routes.ts` → `app/routes/home.tsx`. The entire app lives on one page.
- **Entry layout**: `app/root.tsx` supplies the HTML shell, fonts, and error boundary.
- **Inputs / Results split**:
  - Input components: `app/components/inputs/`
  - Result components: `app/components/results/`
  - Calculation engine: `app/lib/calculations/` (index, profit, financing, gst, sda)
  - Shared types: `app/types/index.ts`
- **Store**: `useFeasibilityStore` holds all user inputs and derived results. It is persisted to `localStorage` under the key `fease-it-storage`.

## Known Bugs / Code Quirks (Verified)

1. **`"sda-hold"` missing from `SCENARIOS`**  
   `app/lib/calculations/index.ts` defines `SCENARIOS` but omits `"sda-hold"`. When users select SDA Hold, the app silently falls back to the first scenario (`"sell-all"`).

2. **Cashflow interest is hardcoded to 6 %**  
   `generateCashflow()` in `app/lib/calculations/index.ts` uses `profitResult.loanAmount * 0.06 / 12` instead of `inputs.financing.interestRate`.

3. **SDA field names say “weekly” but values are monthly**  
   `sdaBasicWeekly`, `rrcWeekly`, `ooaLeaseWeekly` in `app/types/index.ts` and the store default to ~$12,180 (monthly scale). The UI label also says “Monthly per Unit”. This mismatch risks 4.3× errors if true weekly values are ever entered.

4. **Derived results are mirrored back into Zustand**  
   `app/routes/home.tsx` computes `results` from `inputs` via `useMemo`, then pushes them into the store with `useEffect`. This is unnecessary (results are 100 % derivable) and causes an extra render cycle.

5. **Components subscribe to the whole store**  
   Most components destructure the entire store (`const { inputs, setInputs } = useFeasibilityStore()`), so any store change triggers a re-render in every consumer. Prefer selectors or `useShallow`.

## Dependency Notes

- **`lucide-react ^1.14.0`** — the official package has no `1.x` releases (current is `0.x`). Verify this is the legitimate package; it may be a typo or squatting risk.
- **Unused deps** installed but never imported: `react-hook-form`, `@hookform/resolvers`, `zod`. Safe to remove if not needed soon.

## Conventions

- Use the `~/*` import alias for all app code (e.g., `~/components/...`, `~/lib/...`).
- Types and interfaces live in `app/types/index.ts` — do not add hardcoded business values there.
- Default input values (including the loaded feasibility example) are set in `app/stores/feasibilityStore.ts` inside `createDefaultInputs()`.
