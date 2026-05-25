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

### Decision: `isSupabaseConfigured()` works on both server and client
**Context:** Server can't read `import.meta.env.VITE_*`. On the server, it checks `process.env.SUPABASE_URL`.
**Implementation:** Dual-branch function that detects the runtime environment.

### Decision: Keep browser client lazy-initialised; don't force initial session injection yet
**Context:** The plan mentioned passing an initial session to `getSupabaseBrowserClient`. After reviewing the code, the browser client is only used inside async functions (signIn, getCurrentUser, etc.) and never relied upon for synchronous auth state.
**Tradeoff:** Deferring initial session injection to Phase 5 (root layout) to keep Phase 0 focused. The browser client will continue working as-is for now.

### Decision: Consolidate `isSupabaseConfigured` in `client.ts` only
**Context:** Both `client.ts` and `server.ts` needed an `isSupabaseConfigured` check. Rather than export it from both (risking import confusion), I updated the existing `client.ts` export to detect whether it's running on server (`process.env`) or browser (`import.meta.env`) and check the appropriate vars.
**Tradeoff:** One canonical export, but the function has a slight runtime branch. All existing imports continue working unchanged.

---

## 2026-01-25 — Phase 1: Login Route

### Decision: Use `fetcher.Form` pattern with hidden `intent` fields
**Context:** React Router v7 actions receive all form data as `FormData`. To distinguish sign-in vs sign-up vs magic link on a single route, I'm using a hidden `<input name="intent" value="signin|signup|magic" />`.
**Tradeoff:** Simpler than separate routes for each mode. Matches the existing single-page login UI.

### Decision: Pass through `SUPABASE_SECRET_KEY` in server client
**Context:** User explicitly overrode the plan: use `SUPABASE_SECRET_KEY` (service_role) instead of anon key. The server client uses `@supabase/ssr` `createServerClient` with this key.
**Security impact:** The server client bypasses RLS. `requireAuth()` enforces `getUser()` checks before any DB access. Every loader/action must use `requireAuth` or `getAuthUser`.

### Decision: `requireAuth` returns `{ user, supabase, headers }` in local-only mode
**Context:** When Supabase is not configured, `requireAuth` returns `user: null` and `supabase: null` instead of throwing.
**Tradeoff:** Callers must handle the `supabase === null` case and fall back to local state. This preserves the existing local-only UX.

---

## 2026-01-25 — Phase 1: Login Route

### Decision: Use `fetcher.Form` pattern with hidden `intent` fields
**Context:** React Router v7 actions receive all form data as `FormData`. To distinguish sign-in vs sign-up vs magic link on a single route, I'm using a hidden `<input name="intent" value="signin|signup|magic" />`.
**Tradeoff:** Simpler than separate routes for each mode. Matches the existing single-page login UI.

### Decision: Pass through `SUPABASE_SECRET_KEY` in server client
**Context:** User explicitly overrode the plan: use `SUPABASE_SECRET_KEY` (service_role) instead of anon key. The server client uses `@supabase/ssr` `createServerClient` with this key.
**Security impact:** The server client bypasses RLS. `requireAuth()` enforces `getUser()` checks before any DB access. Every loader/action must use `requireAuth` or `getAuthUser`.

### Decision: `requireAuth` returns `{ user, supabase, headers }` in local-only mode
**Context:** When Supabase is not configured, `requireAuth` returns `user: null` and `supabase: null` instead of throwing.
**Tradeoff:** Callers must handle the `supabase === null` case and fall back to local state. This preserves the existing local-only UX.

---

## 2026-01-25 — Phase 2: Projects Route

### Decision: Keep `CreateProjectDialog` client-side for creation
**Context:** The dialog has complex multi-step UI (strategy selection, scenario selection, settings management) and depends on custom strategies stored in Zustand/localStorage. Moving all of this to a server action would require serializing the entire strategy state into form data.
**Tradeoff:** The create flow remains client-side (dialog calls `createProject`/`createScenario` directly). The delete flow is server-side via `fetcher.Form`. This is a pragmatic 80/20 split.
**Note:** After creation, the dialog navigates away (`navigate("/")`), which triggers the projects loader on return. So the list will be fresh.

### Decision: Optimistic delete via `fetcher.Form`
**Context:** Delete buttons are now `<fetcher.Form method="post">` with `intent=delete`. The UI filters out the deleted project immediately while the fetcher is submitting.
**Tradeoff:** No loading spinner for delete; the card disappears instantly. If the server fails, the item would reappear on next navigation (acceptable for now).

### Decision: `Project` type defined inline in route
**Context:** The route previously imported `Project` from `projectService.ts`. Since the loader now queries Supabase directly (not via `projectService`), I defined the type locally in the route file.
**Tradeoff:** Slight duplication, but the route is self-contained. `projectService.ts` remains for client-side auto-save usage.

---

## 2026-01-25 — Phase 3: Project Detail Route

### Decision: Keep add/rename/copy client-side; only delete goes through action
**Context:** The action payload for create/update/duplicate would be enormous (full `FeasibilityInputs` JSON). The existing auto-save `useEffect` already handles incremental sync to Supabase every 2 seconds.
**Tradeoff:** Delete is server-side (instant, no auto-save delay). Add/rename/copy update local state immediately and sync async. This matches how users already experience the app.

### Decision: Loader hydrates Zustand from server data
**Context:** The loader returns `{ project, scenarios }`. A `useEffect` calls `setProject()` and `setScenarios()` to populate the store. This ensures all child input components (which read from Zustand) have data on first render.
**Tradeoff:** Slight double-render on hydration (server HTML → client re-render after Zustand update), but unavoidable since child components depend on Zustand, not `useLoaderData`.

---

## 2026-01-25 — Phase 5: Root Layout Auth

### Decision: Auth loader on `_layout.tsx` instead of `root.tsx`
**Context:** The Header component (in `_layout.tsx`) is where auth state is most useful (showing sign-out button). React Router layout routes support loaders naturally.
**Tradeoff:** Every layout child route waits for the layout loader, but it's a single `getUser()` call — negligible overhead.

---

## 2026-01-25 — Type Fixes

### Fix: `@supabase/ssr` `parseCookieHeader` type mismatch
**Context:** `parseCookieHeader` returns `{ name: string; value?: string | undefined }[]` but `createServerClient` expects `{ name: string; value: string }[]`.
**Fix:** Filter out cookies with undefined values using a type guard: `.filter((c): c is { name: string; value: string } => c.value !== undefined)`.

### Fix: `@supabase/ssr` `setAll` signature takes two arguments
**Context:** `CookieMethodsServer.setAll` has signature `(cookies, responseHeaders)` not just `(cookies)`.
**Fix:** Updated `setAll` to accept both params: `setAll(cookiesToSet, _responseHeaders)`. The second param contains cache-control headers from Supabase; we ignore it since React Router handles response headers.

### Fix: `auth.server.ts` import paths
**Context:** Initial import used relative `./server` from `app/lib/auth.server.ts`, which resolved to `app/lib/server.ts` (non-existent).
**Fix:** Changed to absolute `~/lib/supabase/server` and `~/lib/supabase/client`.

---

## Summary

All phases of the SSR refactor are complete. TypeScript compiles cleanly (`npm run typecheck` passes).

**What changed:**
- `app/lib/supabase/server.ts` — new server client using `SUPABASE_SECRET_KEY`
- `app/lib/auth.server.ts` — new `requireAuth` / `getAuthUser` helpers
- `app/lib/supabase/client.ts` — `isSupabaseConfigured` now works on server + client
- `app/routes/login.tsx` — server `loader` + `action`; `<Form>` submission
- `app/routes/projects.tsx` — server `loader` + `action`; `useLoaderData` + `useFetcher`
- `app/routes/project-detail.tsx` — server `loader` + `action`; hydrates Zustand from loader
- `app/routes/_layout.tsx` — auth `loader` passes user to Header
- `app/components/layout/Header.tsx` — accepts `user` prop, conditionally shows Sign Out

**What stays client-side:**
- Feasibility calculations (`calculateFeasibility`, visx charts)
- Auto-save debounce (2s) for scenario updates
- Project creation dialog (complex multi-step UI with strategy selection)
- Scenario add/rename/copy (local state first, async sync)
- Settings page (localStorage-only strategies)

---

