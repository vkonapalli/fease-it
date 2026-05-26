# AGENTS.md — Fease-It

## Stack & Framework

- **React Router v7** in framework mode with SSR (`ssr: true` in `react-router.config.ts`). This is a full-stack framework, not a plain SPA.
- **React 19**, **TypeScript 5.9**, **Tailwind CSS v4** (via `@tailwindcss/vite`).
- **Vite** is the build tool; path alias `~/*` maps to `./app/*`.
- State management:
  - **React Hook Form (RHF):** Manages deeply nested scenario inputs (`FeasibilityInputs`). RHF acts as the source of truth for active form data.
  - **Zustand:** (`app/stores/appStore.ts`) manages high-level meta-state (e.g. project list, scenario tabs, active scenario ID, custom strategies). Persisted to `localStorage` under `fease-it-storage-v3`.
- Charting via **visx** (`@visx/axis`, `@visx/shape`, `@visx/scale`, `@visx/responsive`, `@visx/tooltip`).
- Database & Auth: **Supabase** (PostgreSQL + Auth).
  - Uses `SUPABASE_SECRET_KEY` (service role) on the server to bypass RLS, so loaders and actions **must** manually verify auth (`getUser()`) and scope queries to the authenticated user.
  - Browser client uses anonymous sign-in or magic link.

## Commands

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Start dev server on `http://localhost:5173` |
| `pnpm build` | Production build (outputs `build/client` + `build/server`) |
| `pnpm start` | Serve production build via `react-router-serve` |
| `pnpm typecheck` | Generate route types (`react-router typegen`) then run `tsc` |

There is **no test runner, linter, or formatter** configured.

## Architecture

- **Routes**: `app/routes.ts` → `home.tsx` (redirects to projects), `projects.tsx` (project list), `project-detail.tsx` (main calculator UI), `settings.tsx` (strategy management), `login.tsx`.
- **Data Access Layer (DAL)**: All DB queries must go through `app/lib/db.server.ts` to enforce user ownership and security.
- **Local-Only Mode**: If Supabase env vars are missing, the application gracefully degrades to local-only mode. Server actions return `{ localOnly: true }` and client logic falls back to persisting data in Zustand + localStorage.
- **Entry layout**: `app/root.tsx` supplies the HTML shell, fonts, and error boundary.
- **Inputs / Results split**:
  - Input components: `app/components/inputs/`
  - Result components: `app/components/results/`
  - Calculation engine: `app/lib/calculations/` (index, profit, financing, gst, sda)
  - Strategies: `app/lib/templates.ts`
  - Shared types: `app/types/index.ts`
- **Database Schema**:
  - `projects` table (1) -> `scenarios` table (N).
  - Scenarios store calculation inputs in JSONB columns: `property`, `acquisition_costs`, `development_strategy`, `development_costs`, `financing`, `revenue`.

## Key Implementation Patterns

- **RHF Subscription for Auto-save**: Auto-saving uses `form.watch(callback)` inside a `useEffect` instead of calling `watch()` directly in the component render body. This prevents the parent from re-rendering on every keystroke and prevents infinite update loops during SSR hydration.
- **Server Actions & JSON**: Fetcher mutations submit as `application/json`. Zod schemas (e.g. `ScenarioActionSchema`) expect `inputs` to be an object (`z.record(z.string(), z.unknown())`), not a JSON string.
- **Client-Side Calculations**: The feasibility calculations (`calculateFeasibility`) and all `visx` chart components must remain client-side (calculated via `useMemo` after hydration) because the SSR value for `results` is `null`.

## Known Bugs / Code Quirks

- `AIChat.tsx` monkey-patches `window.fetch` to intercept headers.
- **`CapitalSpreadInputs` still uses the legacy store shim** (`useInputSlice` from the deleted `feasibilityStore`). This causes it to trigger wider re-renders than modern components which use `useAppStore` with `useShallow`.

## Conventions

- Use the `~/*` import alias for all app code (e.g., `~/components/...`, `~/lib/...`).
- Types and interfaces live in `app/types/index.ts` — do not add hardcoded business values there.
- Default input values (including strategy-specific templates) are set in `app/lib/templates.ts`.
