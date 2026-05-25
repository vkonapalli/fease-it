# SSR Refactor Implementation Plan

## Current State Analysis

### What works today
- React Router v7 framework mode with **SSR already enabled** (`ssr: true`)
- Vercel preset for deployment
- Full-stack project with routes, API routes (`api/chat`), and health check
- Supabase browser client for auth + data
- Zustand store with `localStorage` persistence for offline/local-only mode
- Client-side calculations (profit, financing, GST, SDA, cashflow)

### What's client-side only
| Concern | Current Pattern | SSR Gap |
|---------|----------------|---------|
| **Auth** | `getSupabaseBrowserClient()` + `getCurrentUser()` in `useEffect` | No server-side auth session |
| **Data fetching** | `useEffect` → `getProjects()`, `getScenarios()`, etc. | No loaders; empty HTML on first paint |
| **Mutations** | Direct `createProject()`, `createScenario()` calls | No actions; manual cache invalidation |
| **State** | Zustand + `localStorage` (`fease-it-storage-v3`) | Hydration mismatch risk; server can't read `localStorage` |
| **Auth guards** | `useEffect` redirects to `/login` | User sees flash of content before redirect |
| **Project/scenario CRUD** | Client-side orchestration (create project → create N scenarios → navigate) | Not form-submission driven |

### Key challenge: local-only mode
When `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` are missing, the app falls back to:
- Generating local UUIDs for projects
- Storing everything in Zustand/`localStorage`
- No remote persistence

This must be preserved. SSR should gracefully degrade when Supabase isn't configured.

---

## Target Architecture

### Server-side Supabase client
Create `app/lib/supabase/server.ts` that uses `@supabase/ssr` cookie-based auth:

```ts
// app/lib/supabase/server.ts
import { createServerClient, parseCookieHeader } from "@supabase/ssr";

export function getSupabaseServerClient(request: Request) {
  const headers = new Headers();
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get("cookie") ?? "");
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            headers.append("Set-Cookie", serialize(name, value, options));
          });
        },
      },
    }
  );
  return { supabase, headers };
}
```

> **Env changes needed**: Replace `VITE_SUPABASE_PUBLISHABLE_KEY` (browser-only) with `SUPABASE_ANON_KEY` (works for both browser and server). The browser client can read `import.meta.env.VITE_SUPABASE_URL` but the server client needs `process.env.SUPABASE_URL`. Use the same URL for both.

### Route-by-route migration

| Route | Current | Target |
|-------|---------|--------|
| `/` (`home.tsx`) | `loader()` already exists; redirects to `/projects` | ✅ Already SSR-ready |
| `/login` | Client-side form + `useNavigate` | `action` for sign-in/sign-up; `loader` to redirect already-authenticated users |
| `/projects` | `useEffect` fetches list | `loader` fetches projects server-side; `action` handles create/delete |
| `/projects/:projectId/*` | `useEffect` fetches project + scenarios + auth guard | `loader` fetches project + scenarios; `action` handles scenario CRUD; auth in `loader` |
| `/settings` | Pure client-side (Zustand localStorage) | Keep client-side; no SSR benefit for local-only strategies |
| `/api/chat` | API route (already server-side) | ✅ Already SSR-ready |

---

## Phased Implementation

### Phase 0: Infrastructure (Prerequisites)

**Goal**: Set up server-side Supabase client and cookie-based auth.

1. **Environment variables**
   - Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `.env` (and Vercel dashboard)
   - Keep `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` for backward compat during migration
   - Update `app/lib/supabase/client.ts` to fall back to `SUPABASE_*` env vars if `VITE_*` are missing

2. **Server client**
   - Create `app/lib/supabase/server.ts` with `getSupabaseServerClient(request)`
   - Export a helper `requireAuth(request)` that returns the user or throws a 401 Response

3. **Auth session middleware**
   - In `app/root.tsx`, add a `loader` that reads the auth session and injects it into the app via a `<script>` tag or React context
   - This lets the browser Supabase client initialise from the server-rendered session instead of hitting localStorage

4. **Type safety**
   - Ensure `app/lib/supabase/client.ts` and `app/lib/supabase/server.ts` share the same database types (if you have a generated `database.types.ts`)

> **Estimated effort**: 1 day

---

### Phase 1: Login Route (`/login`)

**Goal**: Convert login from client-side JS to form submission with server actions.

**Current problems**:
- Form is `onSubmit` with `e.preventDefault()`
- Navigation is `useNavigate` after async client call
- No redirect if already logged in

**Changes**:

```tsx
// app/routes/login.tsx
import { Form, redirect, useActionData } from "react-router";
import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return redirect("/projects");
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const mode = formData.get("mode") as "signin" | "signup" | "magic";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { supabase, headers } = getSupabaseServerClient(request);

  try {
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return redirect("/projects", { headers });
    }
    // ... signup, magic link
  } catch (err) {
    return { error: "Something went wrong." };
  }
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  // Use <Form method="post"> instead of <form onSubmit>
  // Use hidden input for mode instead of useState
}
```

**Benefits**:
- Authenticated users are redirected before HTML is sent (no flash of login page)
- Sign-in works without JavaScript (progressive enhancement)
- Auth cookies are properly set server-side

> **Estimated effort**: 0.5 day

---

### Phase 2: Projects List (`/projects`)

**Goal**: Server-render the projects list; handle creation/deletion via actions.

**Changes**:

```tsx
// app/routes/projects.tsx
export async function loader({ request }: Route.LoaderArgs) {
  if (!isSupabaseConfigured()) {
    // Local-only mode: return empty; client will use Zustand
    return { projects: [], localOnly: true };
  }

  const { supabase } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Response(error.message, { status: 500 });
  return { projects: data ?? [], localOnly: false };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (!isSupabaseConfigured()) {
    return { ok: true, localOnly: true };
  }

  const { supabase, headers } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  if (intent === "create") {
    const name = formData.get("name") as string;
    const { data, error } = await supabase
      .from("projects")
      .insert({ name, user_id: user.id })
      .select()
      .single();
    if (error) return { error: error.message };
    return { project: data };
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;
    await supabase.from("projects").delete().eq("id", id);
    return { ok: true };
  }

  return null;
}
```

**Component changes**:
- Use `useLoaderData()` for the initial projects list
- Use `useFetcher()` for create/delete so the page doesn't navigate away
- `CreateProjectDialog` submits a `<fetcher.Form>` instead of calling `createProject()` directly
- The `onCreated` callback from the hotfix becomes unnecessary (the action response updates `useFetcher().data`)

**Delete flow**:
- Each delete button becomes a `<fetcher.Form method="post">` with `<input type="hidden" name="intent" value="delete" />`
- Optimistic UI: filter out the project immediately, let the fetcher reconcile

> **Estimated effort**: 1 day

---

### Phase 3: Project Detail (`/projects/:projectId/*`)

**Goal**: Server-render project name + scenarios; handle scenario CRUD via actions.

This is the most complex route because it has:
- Auth guard
- Project metadata fetch
- Scenario list fetch
- URL-driven active scenario selection
- Auto-save to Supabase
- Add/delete/rename/copy scenarios
- Feasibility calculations (client-side only, stays client-side)

**Loader**:

```tsx
// app/routes/project-detail.tsx
export async function loader({ request, params }: Route.LoaderArgs) {
  const projectId = params.projectId;
  if (!projectId) throw redirect("/projects");

  if (!isSupabaseConfigured()) {
    return { project: null, scenarios: [], localOnly: true };
  }

  const { supabase } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const [{ data: project }, { data: scenarios }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).single(),
    supabase
      .from("scenarios")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
  ]);

  if (!project) throw redirect("/projects");

  return {
    project,
    scenarios: (scenarios ?? []).map(deserializeScenario),
    localOnly: false,
  };
}
```

**Actions**:

```tsx
export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const projectId = params.projectId;

  if (!isSupabaseConfigured()) return { ok: true, localOnly: true };

  const { supabase } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  if (intent === "create-scenario") {
    // ... create scenario
  }
  if (intent === "update-scenario") {
    // ... update scenario
  }
  if (intent === "delete-scenario") {
    // ... delete scenario
  }
  if (intent === "duplicate-scenario") {
    // ... duplicate with options
  }

  return null;
}
```

**Component changes**:
1. **Remove auth guard `useEffect`** — the loader already handles it
2. **Remove project fetch `useEffect`** — the loader already provides `project`
3. **Remove scenario fetch `useEffect`** — the loader already provides `scenarios`
4. **Hydrate Zustand from loader data** on mount:
   ```ts
   const { project, scenarios } = useLoaderData<typeof loader>();
   useEffect(() => {
     setProject(project?.id ?? null, project?.name ?? "");
     setScenarios(scenarios.map(s => ({ ...s, synced: true, remoteId: s.id })));
   }, [project, scenarios]);
   ```
5. **Auto-save**: Keep the debounced `useEffect` that syncs unsaved changes to Supabase, but also update `remoteId` when the action confirms creation
6. **Scenario CRUD**: Convert `handleAddScenario`, `handleDeleteScenario`, `handleRenameScenario`, `handleCopyScenario` to use `useFetcher()` submitting to the action
7. **URL scenario selection**: Keep the existing `useEffect` that syncs `scenarioFromUrl` to `activeScenarioId`, but it now works with server-hydrated data

**Key insight**: The feasibility calculations (`calculateFeasibility`) and all visx chart components **must stay client-side**. The SSR value for `results` is `null` on the server; `useMemo` computes it after hydration.

> **Estimated effort**: 2–3 days

---

### Phase 4: Settings (`/settings`)

**Goal**: Decide whether to SSR this route.

**Analysis**:
- Settings only manages custom strategies stored in Zustand/`localStorage`
- No Supabase interaction
- No auth requirement
- Purely client-side state

**Decision**: **Skip SSR for this route.** Keep it as a client-only route. The only change needed is to remove any unnecessary `useEffect` patterns.

> **Estimated effort**: 0 days

---

### Phase 5: Root Layout + Global Auth State

**Goal**: Inject auth session into the app so the browser client can initialise from it.

**Changes to `app/root.tsx`**:

```tsx
export async function loader({ request }: Route.LoaderArgs) {
  if (!isSupabaseConfigured()) {
    return { user: null, localOnly: true };
  }
  const { supabase } = getSupabaseServerClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  return { user, localOnly: false };
}

export default function App() {
  const { user, localOnly } = useLoaderData<typeof loader>();
  // Pass user to a context or use it to initialise the browser supabase client
  return <Outlet />;
}
```

**Browser client initialisation**:

Update `app/lib/supabase/client.ts` to optionally accept an initial session:

```ts
export function getSupabaseBrowserClient(initialSession?: Session) {
  if (client) return client;
  // ... create client
  if (initialSession) {
    client.auth.setSession(initialSession);
  }
  return client;
}
```

This eliminates the "flash of unauthenticated state" on every page load.

> **Estimated effort**: 0.5 day

---

### Phase 6: Clean-up & Deprecation

**Goal**: Remove dead code and consolidate patterns.

1. **Deprecate client-side `projectService.ts` functions** used only in `useEffect`:
   - `getProjects()`, `getProject()`, `getScenarios()` can be removed from the component import paths
   - Keep them in `projectService.ts` but mark as `@deprecated` — they may still be used by the auto-save `useEffect`
2. **Remove `CreateProjectDialog.onCreated` callback** (the hotfix from this session) — no longer needed because the action response drives the UI
3. **Remove all auth-guard `useEffect`s** from routes — handled by loaders
4. **Remove manual `setLoading(true)` / `setLoading(false)`** in routes — React Router's `useNavigation().state` provides this
5. **Update `_layout.tsx`** to conditionally render the header based on auth state from root loader

> **Estimated effort**: 0.5 day

---

## Data Flow After Refactor

### Before (client-side only)
```
Browser → GET /projects
  → Server renders empty shell + JS bundle
  → Hydrate React
  → useEffect fires
    → getCurrentUser() → redirect if not auth
    → getProjects() → setProjects(data)
    → re-render with list
```

### After (SSR)
```
Browser → GET /projects
  → Server: check auth cookie
    → If not auth: 302 redirect to /login
    → If auth: query Supabase for projects
  → Server renders HTML with full project list
  → Hydrate React (list is already there, no fetch needed)
  → JS bundle loads (non-blocking)
```

### After (form submission)
```
Browser → POST /projects (create)
  → Server: validate auth, insert into Supabase
  → Server returns JSON { project }
  → React Router revalidates loader
  → List updates without full page reload
```

---

## Local-Only Mode Strategy

The app must continue working when Supabase env vars are missing. Here's how each phase handles it:

| Phase | Local-Only Behaviour |
|-------|----------------------|
| **Infrastructure** | `isSupabaseConfigured()` returns false; skip server client creation |
| **Login** | Loader returns `null`; form submission is a no-op; user stays on login page (or we redirect to `/projects` with a guest flag) |
| **Projects** | Loader returns `{ projects: [], localOnly: true }`; component shows "No projects yet" and the create dialog generates a local UUID |
| **Project Detail** | Loader returns `{ project: null, scenarios: [], localOnly: true }`; component uses Zustand state exclusively |
| **Actions** | All actions return `{ localOnly: true }` early; client-side fallback handles the mutation in Zustand |

**Important**: The local-only mode should probably be more explicit. Consider adding a `?local=1` query param or a global flag so the server and client agree on which mode is active.

---

## Files to Create / Modify

### New files
- `app/lib/supabase/server.ts` — server-side Supabase client
- `app/lib/supabase/types.ts` — shared database types (if not already present)
- `app/lib/auth.server.ts` — `requireAuth(request)` helper

### Modified files
| File | Changes |
|------|---------|
| `.env` / `.env.example` | Add `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| `app/lib/supabase/client.ts` | Accept optional initial session |
| `app/root.tsx` | Add `loader` for global auth state |
| `app/routes/login.tsx` | Add `loader` + `action`; convert to `<Form>` |
| `app/routes/projects.tsx` | Add `loader` + `action`; use `useLoaderData` + `useFetcher` |
| `app/routes/project-detail.tsx` | Add `loader` + `action`; hydrate Zustand from loader |
| `app/components/inputs/CreateProjectDialog.tsx` | Submit via `fetcher.Form` instead of direct API calls |
| `app/services/authService.ts` | Keep for browser client; add server-side equivalents |
| `app/services/projectService.ts` | Keep for auto-save; mark fetch functions `@deprecated` |

---

## Testing Strategy

1. **Unit tests for loaders/actions** (if you add a test runner later)
   - Mock `getSupabaseServerClient` to return a test supabase instance
   - Assert correct redirect for unauthenticated requests
   - Assert correct data shape for authenticated requests

2. **Manual testing checklist**
   - [ ] Hard refresh on `/projects` while logged in → sees project list immediately (no loading spinner)
   - [ ] Hard refresh on `/projects` while logged out → redirect to `/login`
   - [ ] Hard refresh on `/projects/:id` → sees project + scenarios immediately
   - [ ] Create project → appears in list without refresh
   - [ ] Delete project → disappears immediately
   - [ ] Add scenario → appears in tab bar immediately
   - [ ] Rename scenario → persists after refresh
   - [ ] Local-only mode (`VITE_SUPABASE_URL` unset) → all flows still work
   - [ ] JavaScript disabled → login form still submits; project list doesn't work (acceptable)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Hydration mismatch** between server-rendered HTML and client Zustand state | Medium | High | Always initialise Zustand from `useLoaderData` on mount; don't read `localStorage` before hydration completes. Use Zustand's `skipHydration` or gate on `useEffect`. |
| **Auth cookie not set correctly** after server-side sign-in | Low | High | Ensure `headers` from `getSupabaseServerClient` are passed to all `redirect()` and `json()` responses. |
| **Auto-save conflicts** with action-based mutations | Medium | Medium | Debounced auto-save should check if a fetcher action is in-flight (`fetcher.state !== "idle"`) and skip. Or move all mutations to actions and remove auto-save. |
| **Vercel cold start latency** for server-side Supabase queries | Medium | Medium | Use React Router's `defer()` for non-critical data (e.g., project list can stream in). Critical data (auth, project name) should be awaited. |
| **Local-only mode complexity** increases with SSR branches | Medium | Medium | Extract `isSupabaseConfigured()` checks into a shared helper; keep local-only paths minimal and well-tested. |

---

## Total Estimated Effort

| Phase | Days |
|-------|------|
| 0: Infrastructure | 1 |
| 1: Login | 0.5 |
| 2: Projects | 1 |
| 3: Project Detail | 2–3 |
| 4: Settings | 0 |
| 5: Root + Global Auth | 0.5 |
| 6: Clean-up | 0.5 |
| **Total** | **5.5–6.5 days** |

---

## Recommended Order of Execution

1. **Start with Phase 0** (infrastructure) — everything else depends on it
2. **Then Phase 5** (root auth) — gives you global auth state for testing
3. **Then Phase 1** (login) — simplest route, good for validating the pattern
4. **Then Phase 2** (projects) — validates data fetching + mutations via actions
5. **Then Phase 3** (project detail) — the big one; by now the patterns are established
6. **Finally Phase 6** (clean-up)

This order lets you validate the SSR infrastructure on simple routes before tackling the most complex one.
