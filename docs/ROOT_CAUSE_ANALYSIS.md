# Root Cause Analysis: Maximum Update Depth Exceeded

## Summary

The infinite loop is caused by a **two-way binding trap** between React Hook Form (RHF) and the Zustand store, amplified by SSR hydration. The current architecture tries to keep RHF and Zustand in perfect sync on every keystroke, which creates a circular update cycle that can spin infinitely during the rapid state transitions of SSR hydration.

---

## Detailed Root Cause

### 1. Two-Way Binding Trap (Primary Cause)

In `app/routes/project-detail.tsx`, there are two opposing effects that fight each other:

**Effect A — Auto-save: RHF → Zustand**
```tsx
const formValues = watch();

useEffect(() => {
  if (!isEqual(formValues, currentScenario.inputs)) {
    updateScenarioLocal(activeScenarioId, { inputs: formValues });  // writes to store
    debouncedSave(...);
  }
}, [formValues, activeScenarioId, scenarios, updateScenarioLocal, debouncedSave]);
```

**Effect B — Reset on external change: Zustand → RHF**
```tsx
useEffect(() => {
  if (idChanged || inputsChanged) {
    reset(activeScenario.inputs);  // writes to RHF
  }
}, [activeScenario, reset]);
```

**The Loop:**
1. User types → RHF updates internal `_formValues`
2. `watch()` returns the updated object → `ProjectDetail` re-renders
3. Auto-save effect detects change → calls `updateScenarioLocal()`
4. Zustand creates a new `scenarios` array → `ProjectDetail` re-renders (subscribes to `scenarios`)
5. `activeScenario` recalculates (new reference)
6. Reset effect sees `inputsChanged = true` → calls `reset(activeScenario.inputs)`
7. `reset()` updates RHF state → triggers `watch()` subscribers → re-render
8. On this re-render, `watch()` might return a NEW object reference (RHF clones on reset)
9. Auto-save effect runs again → if object references differ, `isEqual` still returns true, but...
10. In SSR hydration, steps 3–7 can fire in rapid succession before React has stabilized, creating a cascading re-render chain that exceeds React's update depth limit.

### 2. `watch()` in Render Causes Parent Re-Render on Every Keystroke

```tsx
const { watch, reset } = methods;
const formValues = watch();
```

`watch()` without arguments subscribes to ALL form fields. Every keystroke re-renders `ProjectDetail`. While not a loop by itself, it makes the component extremely sensitive to any state change and guarantees the auto-save effect fires on every input.

### 3. `mode: "onChange"` + Zod Resolver Amplifies Re-Renders

```tsx
const methods = useForm<FeasibilityInputs>({
  resolver: zodResolver(FeasibilityInputsSchema),
  mode: "onChange",
});
```

Validation runs on every keystroke. If the Zod schema transforms values or adds defaults, RHF's internal state can diverge from the store's stored object in subtle ways (e.g., `undefined` → `""`, missing keys added), causing `isEqual` to return false even when values "should" be the same.

### 4. SSR Hydration Creates Rapid State Transitions

During SSR:
- Zustand returns its **initial** state (`scenarios: [defaultScenario]`, `activeScenarioId: null`)
- RHF is initialized with `defaultValues: undefined`
- Server renders empty/default inputs

During client hydration:
1. `useEffect` in `root.tsx` calls `useAppStore.persist.rehydrate()` → loads localStorage data
2. `useEffect` in `project-detail.tsx` calls `hydrateFromServer()` → merges server data
3. Both update the store within milliseconds
4. Each update triggers the reset effect
5. Each `reset()` triggers RHF subscribers
6. The auto-save effect fires between these transitions

Because these effects run in quick succession during hydration, the circular loop can spin faster than React can stabilize, hitting the maximum update depth.

---

## Why `isEqual` Does Not Prevent the Loop

The `isEqual()` utility does a deep comparison, but it cannot help when:
- RHF mutates its internal object reference in-place (so `obj1 === obj2` passes, but only temporarily)
- `reset()` creates a cloned object with the same values but a different reference
- The store holds the old RHF object while RHF now has a new cloned object
- On the next keystroke, `isEqual(newRhfObj, oldStoreObj)` returns **false** because one has the new keystroke and the other doesn't

The fundamental issue is that **comparing values is not enough** when the comparison itself happens inside a re-render cycle triggered by the same values changing.

---

## How Trackhub-Web Solved This

The trackhub-web project (Remix + React Hook Form + auto-save) uses a much simpler and safer pattern:

### Pattern: RHF as Single Source of Truth

**File:** `apps/web/app/components/tracker-add-on-checks-form.tsx`

```tsx
const form = useForm<UpdateAddOnChecksRequest>({
  resolver: zodResolver(UpdateAddOnChecksRequest),
  defaultValues: extractFormData(tracker),
});

const onSubmit: SubmitHandler<UpdateAddOnChecksRequest> = useCallback(
  (data) => {
    fetcher.submit({ intent: "update-add-on-checks", data }, { method: "post", encType: "application/json" });
  },
  [fetcher]
);

const onSubmitDebouncer = useMemo(
  () => debounce(form.handleSubmit(onSubmit), { timing: "trailing", waitMs: 1000 }),
  [form, onSubmit]
);

// KEY: Use form.watch() SUBSCRIPTION, not watch() in render
useEffect(() => {
  const subscription = form.watch((_, { type }) => {
    if (type) void onSubmitDebouncer.call();  // only fire on real changes, not reset
  });
  return () => subscription.unsubscribe();
}, [form, onSubmitDebouncer]);
```

### Why This Works

1. **`form.watch(callback)` subscription** — Only fires when form values actually change, not on every parent re-render. The `{ type }` payload tells you whether it was a user input (`"change"`) or a reset (`"reset"`), so you can ignore resets.

2. **`form.handleSubmit(onSubmit)`** — Validates the form and only submits if valid. This is the canonical RHF way to extract and submit data.

3. **`debounce` on `handleSubmit`, not on values** — You debounce the submit action, not the value comparison. This avoids the `useEffect` dependency on form values entirely.

4. **No client-side store mirroring form state** — The form state lives in RHF. Server sync happens directly from RHF to the server. No intermediate store that needs to be kept in sync on every keystroke.

5. **`form.reset(serverData)` on save success** — After the server confirms the save, reset the form to the server data. This clears `isDirty` and prevents stale "unsaved changes" state.

---

## Recommended Architecture for Fease-it

### Option A: Minimal Fix (Keep Current Architecture, Fix the Loop)

Replace the `watch()` + `useEffect` auto-save with a `form.watch()` subscription pattern, similar to trackhub-web. Add guards to the reset effect so it doesn't fight with user input.

**Pros:** Minimal code changes.
**Cons:** Still maintains the two-way binding; still re-renders parent on every keystroke.

### Option B: Proper Fix (RHF as Source of Truth, Store for Meta-Data Only)

Rebuild the state management so that:
- **RHF owns the form state** completely (inputs, values, dirty state)
- **Zustand owns meta-state** only (scenario list, active scenario ID, project info, strategies)
- **Auto-save** goes RHF → Server directly (via debounced `handleSubmit`)
- **On successful save**, server returns the saved scenario → `form.reset(savedInputs)` → `markScenarioSynced()`
- **On scenario switch**, load the scenario's inputs into RHF via `reset()`
- **Cross-tab sync** can still work: use Zustand's `onRehydrateStorage` or `subscribe` to detect external changes, then `reset()` only when the active scenario's inputs changed from OUTSIDE the form

**Pros:** Eliminates the two-way binding entirely; follows RHF best practices; much simpler mental model.
**Cons:** Requires refactoring how `AIChat` and other components update inputs (they should call RHF `setValue` or `reset`, not update the store directly).

### Option C: Full Refactor (URL-Driven State + No Zustand for Form Data)

For an even cleaner architecture:
- Remove Zustand persist for form data entirely
- Keep scenario list and active ID in Zustand (or React Router's built-in state)
- Drive form state purely from the loader data + RHF
- Save via Remix/React Router actions
- The browser's `beforeunload` handler warns about dirty forms

**Pros:** SSR-friendly by default; no hydration mismatch; no infinite loop risk.
**Cons:** Loses cross-tab auto-sync of unsaved changes (but this can be added back with a simpler broadcast channel approach).

---

## Immediate Fix to Apply

The smallest safe fix is to adopt trackhub-web's `form.watch()` subscription pattern and prevent the reset effect from running while the user is actively typing.

Changes needed in `app/routes/project-detail.tsx`:

1. **Remove the auto-save `useEffect`** that depends on `formValues`
2. **Add a `form.watch()` subscription** for auto-save, guarded by `type !== "reset"`
3. **Guard the reset effect** with `!methods.formState.isDirty` so it doesn't fight with user input
4. **Keep `watch()` for results calculations** (this is fine for a calculator)

This breaks the circular loop while preserving the real-time calculation behavior.
