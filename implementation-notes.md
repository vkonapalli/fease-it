# SSR Implementation Notes

Running log of decisions, tradeoffs, and changes made during the SSR refactor.

---

## 2026-01-25 — Phase 0: Infrastructure

### Decision: Use `SUPABASE_SECRET_KEY` for server client (NOT anon/publishable key)
**Context:** User explicitly requested: "No supabase anon key, we will use SUPABASE_SECRET_KEY instead. as anon is legacy." The `.env` contains `SUPABASE_SECRET_KEY`.
**Security warning:** The secret key (service_role) bypasses ALL Row Level Security (RLS). Every loader and action MUST manually verify auth via `getUser()` and scope every query to the authenticated user. A leak of this key is catastrophic.
**Implementation:** Server client uses `@supabase/ssr` `createServerClient` with the secret key. Auth session management still works via cookies (the JWT validation is independent of the key's role), but database operations bypass RLS. Manual user scoping is enforced in a `requireAuth()` helper.

### Decision: Install `cookie` package for `serialize`
**Context:** `@supabase/ssr` provides `parseCookieHeader` but not `serialize` for setting cookies. React Router needs raw `Set-Cookie` headers.
**Action:** Added `cookie` as a dependency. It's tiny (1.5KB) and the standard solution.

### Decision: Server client returns `{ supabase, headers }` not just `supabase`
**Context:** `createServerClient` with cookie `setAll` mutates an internal `Headers` instance. The caller must merge those headers into the Response.
**Pattern:** Every loader/action that calls `getSupabaseServerClient` must pass `headers` to its return value (`return redirect("/", { headers })` or `return json(data, { headers })`).

---

## 2026-01-25 — Phase 1: Login Route

### Decision: Use `fetcher.Form` pattern with hidden `intent` fields
**Context:** React Router v7 actions receive all form data as `FormData`. To distinguish sign-in vs sign-up vs magic link on a single route, I'm using a hidden `<input name="intent" value="signin|signup|magic" />`.
**Tradeoff:** Simpler than separate routes for each mode. Matches the existing single-page login UI.

---

## 2026-01-25 — Phase 2: Projects Route

### Decision: Keep `CreateProjectDialog` client-side for creation
**Context:** The dialog has complex multi-step UI (strategy selection, scenario selection, settings management) and depends on custom strategies stored in Zustand/localStorage. Moving all of this to a server action would require serializing the entire strategy state into form data.
**Tradeoff:** The create flow remains client-side (dialog calls `createProject`/`createScenario` directly). The delete flow is server-side via `fetcher.Form`. This is a pragmatic 80/20 split.

### Decision: Optimistic delete via `fetcher.Form`
**Context:** Delete buttons are now `<fetcher.Form method="post">` with `intent=delete`. The UI filters out the deleted project immediately while the fetcher is submitting.
**Tradeoff:** No loading spinner for delete; the card disappears instantly. If the server fails, the item would reappear on next navigation (acceptable for now).

---

## 2026-01-25 — Phase 3: Project Detail Route

### Decision: Keep add/rename/copy client-side; only delete goes through action
**Context:** The action payload for create/update/duplicate would be enormous (full `FeasibilityInputs` JSON). The existing auto-save `useEffect` already handles incremental sync to Supabase every 2 seconds.
**Tradeoff:** Delete is server-side (instant, no auto-save delay). Add/rename/copy update local state immediately and sync async. This matches how users already experience the app.

---

## 2026-05-25 — React Hook Form Migration

### Decision: Replace Zustand Global Input State with `react-hook-form`
**Context:** The application previously used a monolithic Zustand store (`appStore.ts` & `feasibilityStore.ts`) for all scenario inputs. Every keystroke updated global state, triggering expensive re-renders across the entire React tree.
**Tradeoffs:**
- **Store split:** `useAppStore` now *only* manages the high-level list of scenarios (for tabs, IDs, sync status) and custom strategies. It no longer manages the active form data keystroke-by-keystroke.
- **Form Context:** `ProjectDetail` wraps its children in `<FormProvider>`, allowing deeply nested input components (e.g., `CapitalStackInputs`) to use `useFormContext` instead of Zustand selectors.
- **Tab Switching:** Switching tabs calls `form.reset(newScenario.inputs)` to hydrate the form with the new active scenario's data. I implemented a `useRef` based guard to ensure that switching tabs doesn't trigger an accidental auto-save of the *previous* scenario's data onto the *new* scenario.
- **Auto-save Loop Protection:** Since the form's `watch()` feeds the real-time `calculateFeasibility` memo, and we sync RHF changes back to Zustand for the background auto-saver, I added logic to the `form.reset` effect to distinguish between "User switching tabs" (requires reset) vs "AI Chat updating Zustand" (requires reset) vs "RHF syncing to Zustand" (must NOT trigger reset).

### Decision: Use `Controller` for custom UI components
**Context:** UI components like `<NumberField>` and `<Toggle>` have custom parsing/formatting logic and non-standard `onChange` signatures.
**Action:** Instead of complex `forwardRef` boilerplate for every UI primitive, I used the RHF `<Controller>` pattern in all input components. This provides a clean bridge between RHF's state and the custom components while preserving their existing logic.

### Decision: Handle nested Field Arrays manually in some cases
**Context:** Components like `JVInputs` and `CashflowInputs` have deeply nested arrays (e.g., `rounds[].investors[]`).
**Action:** While `useFieldArray` was used for the top-level arrays, the nested arrays were sometimes updated via `setValue` for simplicity and to ensure the parent `totalRaised` fields were recalculated correctly.

### Decision: Replace `setTimeout` hacks with proper Debounced Auto-save
**Context:** The previous auto-save implementation used multiple `useEffect` hooks with manual `setTimeout` calls to sync data from React Hook Form to Zustand, and then from Zustand to Supabase. This was fragile and prone to race conditions.
**Action:**
1. Created a standard `debounce` utility in `app/lib/utils.ts`.
2. Consolidated the sync logic in `ProjectDetail` into a single `useEffect` that watches form changes.
3. Updates to the local Zustand store (for tab switching sync) happen immediately.
4. Updates to the server happen via a `debouncedSave` callback using the new utility, ensuring only one network request is fired after the user stops typing for 2 seconds.
**Benefit:** Cleaner code, no manual timeout management/cleanup in effects, and significantly more robust data synchronization.

---

## 2026-05-25 — Strategy & Pricing Model Refactor

### Decision: Rename `sell-all` to `build-sell`
**Implementation:** Renamed `sell-all` to `build-sell` throughout the app (types, schemas, calculations, templates, and UI components).

### Decision: Update Pricing Model / Income UI
**Implementation:** 
- Updated `DevelopmentStrategyInputs.tsx` with the new label `Pricing model/Income`.
- Added `averageBuildAreaPerLot` field to `DevelopmentStrategy` type and UI.
- Construction costs now use `numDwellings * averageBuildAreaPerLot * constructionCostPerSqm` when the pricing model is "average".

### Decision: Implement Line-by-Line Feasibility Table
**Implementation:** Created a new `FeasibilityTable.tsx` component that shows a detailed breakdown of costs and revenue. Reordered components in `project-detail.tsx` to prioritize this table.

---

## 2026-05-26 — SSR Bugfixes & Type Safety Improvements

### Decision: Upgrade React Router to v7.15.1
**Context:** We were on v7.15.0; latest is v7.15.1. Bugfix release with minor type improvements.
**Action:** Updated `react-router`, `@react-router/node`, `@react-router/dev`, `@react-router/serve` to `7.15.1`.

### Bugfix: `ScenarioActionSchema` rejected JSON fetcher `inputs` — CRITICAL
**Root cause:** All fetcher/submit calls were changed to `encType: "application/json"`. But `ScenarioActionSchema` defined `inputs: z.string().optional()`. JSON-submitted `inputs` arrives as an object, not a string, so Zod validation failed EVERY TIME. This meant auto-saves silently failed (no DB writes) and scenario creation also failed.
**Fix:** Changed `inputs` to `z.union([z.string(), z.record(z.string(), z.unknown())]).optional()`. Also replaced `z.any()` (removed in Zod v4) with `z.unknown()`.
**Impact:** All auto-saves, scenario creation, and duplicates now actually persist to Supabase.

### Bugfix: Scenarios query missing `user_id` scope in loader — SECURITY
**Root cause:** `project-detail.tsx` loader queried scenarios with only `.eq("project_id", projectId)` — no user ownership check. Since we use the service role key (which bypasses RLS), any authenticated user could read another user's scenarios by guessing a projectId.
**Fix:** Replaced raw Supabase queries with DAL functions (`db.getProject` → verify ownership, `db.getScenarios` which internally verifies project ownership). All queries now go through `app/lib/db.server.ts` which enforces user scoping.
**Tradeoff:** One extra DB round-trip (project ownership check before scenario query) but it's sequential, not parallel. Security trumps latency here.

### Bugfix: `markScenarioSynced` matched wrong ID for `update-scenario`
**Root cause:** The auto-save for updates sends `{ id: remoteId }` (Supabase UUID). The action returns `{ ok: true, id: remoteId }`. The response handler called `markScenarioSynced(data.id, data.id)` which searched for `s.id === remoteUUID` — but Zustand scenarios use local UUIDs as their `id`. The synced flag was never set, causing repeated auto-save retries.
**Fix:** For `update-scenario`, use `markScenarioSynced(activeScenarioId, data.id)` — match on the local UUID, set `remoteId` to the server-confirmed ID. For `create-scenario`, keep `markScenarioSynced(data.id, data.id)` since we pass `localId` as the DB insert ID.
**Impact:** Auto-save now correctly marks scenarios as synced after successful server persistence. No more redundant retries.

### Bugfix: `api.chat.ts` crashed in local-only mode — CRITICAL
**Root cause:** `getSupabaseServerClient()` throws if `SUPABASE_URL`/`SUPABASE_SECRET_KEY` env vars are missing. The loader and action in `api.chat.ts` called it unconditionally. In local-only mode (no Supabase configured), any chat request crashed with a 500 error.
**Fix:** Added `isSupabaseConfigured()` guard at the top of both `loader()` and `handleChat()`/`handleSave()` — return HTTP 501 with a clear error message instead of crashing.
**Impact:** Chat gracefully degrades in local-only mode instead of crashing.

### Bugfix: `db.server.ts` `inputs: any` → typed `FeasibilityInputs`
**Root cause:** `createScenario` accepted `inputs: any`, losing all type safety for the main data payload at the DAL boundary.
**Fix:** Changed to `inputs: FeasibilityInputs`. Required adding `as unknown as FeasibilityInputs` in `api.chat.ts` where `applyOverrides` returns `Record<string, unknown>`.

### Decision: Rename `types/index.ts` `Scenario` → `DbScenario`
**Context:** Two `Scenario` interfaces existed — one in `app/stores/appStore.ts` (UI state with `synced`, `remoteId`, `isPlaceholder`) and one in `app/types/index.ts` (DB entity with `project_id`, `results`, `created_at`). Both were imported in close proximity, causing confusion.
**Action:** Renamed the types file `Scenario` to `DbScenario`. Updated `db.server.ts` to import `DbScenario`. Store `Scenario` keeps its name since it's more widely used.
**Tradeoff:** The functions `getScenarios`, `createScenario`, `updateScenario`, `deleteScenario` in `db.server.ts` kept their names (they describe what they do). Only the type references changed.

### Decision: `root.tsx` no longer needs a loader for global auth
**Context:** Previously, `root.tsx` had a loader that called `getAuthUser()` and `_layout.tsx` also called `getUser()`. This caused a double auth check on every navigation.
**Fix:** Removed the loader from `root.tsx`. Only `_layout.tsx` fetches the user and passes it to `<Header>`. Individual routes use `requireAuth()` in their loaders as needed.
**Tradeoff:** Slightly less centralized auth, but eliminates redundant `getUser()` calls.

### Decision: `_layout.tsx` error logging
**Context:** The loader catch block returned `{ user: null }` silently on any error, masking connection failures.
**Fix:** Added `console.error("Failed to get auth user in layout loader:", err)` before returning `{ user: null }`. Users still see a logged-out state on errors, but errors are now visible in server logs.

### Decision: `handleCopyScenario` static import instead of async `import()`
**Context:** `handleCopyScenario` used `import("~/lib/templates").then(m => m.createBaseInputs())` — a dynamic import that could fail if the user navigated away during chunk loading.
**Fix:** Added `import { createBaseInputs } from "~/lib/templates"` at the top and replaced the dynamic import with a direct `createBaseInputs()` call. No async gap between user action and form submission.

### Decision: Typed `ActionData` for `useFetcher`
**Context:** `useFetcher<typeof action>()` failed with `Property 'data' does not exist on type 'never'` because the action returns both `redirect()` (typed as `never` in RR v7) and plain data objects. TypeScript couldn't distinguish fetcher paths from navigation paths in the same function.
**Fix:** Defined an explicit `ActionData` discriminated union type and used `useFetcher<ActionData>()`. This is the standard React Router v7 pattern when an action handles both navigation redirects and background fetcher data returns.
**Tradeoff:** The action function doesn't have its own return type annotation — we trust `ActionData` to be accurate. If we add new data-returning branches to the action, we must update `ActionData` too. This is explicit and traceable.

### Decision: All route loaders now go through DAL
**Context:** Multiple routes had raw `supabase.from(...)` queries that bypassed user-scoping checks. With service role key, this is a security risk.
**Action:** All data access now goes through `app/lib/db.server.ts` functions which enforce user ownership checks on every query. Routes import `* as db from "~/lib/db.server"` and use `db.getProject()`, `db.getScenarios()`, etc.
**Tradeoff:** Slightly more verbose (need to pass `request` and `userId` to every call), but centralizes security — no raw supabase queries leaking across user boundaries.

---

## Remaining Issues (Deferred)

- **AIChat `window.fetch` monkey-patch** (`AIChat.tsx:210-226`): Fragile but works. Would benefit from a custom AI SDK transport that captures response headers natively.
- **`ScenarioActionSchema` `id` optional but required for some intents**: Runtime guards (if-checks) prevent issues, but schema validation doesn't enforce intent-specific required fields. Low priority.
- **`feasibilityStore.ts` deleted**: Confirmed no stale imports remain. Legacy `useFeasibilityStore` shim was fully removed in the RHF migration.
