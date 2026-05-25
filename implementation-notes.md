# Implementation Notes: Rename Template Packs → Strategies

## Overview
Renaming the "Template Pack" concept to "Strategy" across the codebase. Moving from 4 built-in packs with pre-built scenarios to 3 built-in strategies with empty scenario lists. Projects created from built-in strategies start with one generic default scenario.

## Decisions & Tradeoffs

### 1. Type Renaming
- `TemplatePack` → `Strategy`
- `ScenarioTemplate` → `StrategyScenario`
  - **Why:** `ScenarioTemplate` was used inside TemplatePacks. Renaming to `StrategyScenario` avoids confusion with the runtime `Scenario` type in the store.

### 2. Persist Key Bump
- Changed `fease-it-storage-v2` → `fease-it-storage-v3`
  - **Why:** Per user instruction, no data migration needed. Existing users will start fresh.

### 3. Empty Built-In Strategies
- Land Subdivision, Build & Hold, Build & Sell all have `scenarios: []`
  - **Why:** Per spec. Users add scenarios themselves.

### 4. Default Scenario on Project Creation
- When creating a project from a built-in strategy with no pre-built scenarios, the dialog creates one default scenario using `createBaseInputs()`.
  - **Why:** Avoids needing an empty-state UI in project-detail.tsx. The user can rename/delete/add as normal.

### 5. Keeping ScenarioTemplate / createScenarioTemplate
- The factory function `createScenarioTemplate` and related helpers are kept as `createStrategyScenario`.
  - **Why:** Still needed for custom strategies and when users add scenarios in settings or project detail.

### 6. Settings Page Functionality
- Settings page keeps all existing functionality (clone, edit, reorder, add/remove scenarios within a strategy).
  - **Why:** Per user instruction, "That can be kept as it is to support the strategy."

### 7. ProjectScenario enum values unchanged
- The 6 underlying `ProjectScenario` values (`sell-all`, `build-hold`, `sda-hold`, etc.) remain unchanged.
  - **Why:** They are the calculation engine's strategy types. Only the UI grouping concept changed.

### 8. CreateProjectDialog "Save as Custom" Visibility
- The "Save as Custom" button only appears when the selected strategy has scenarios AND is built-in.
  - **Why:** Saving an empty built-in strategy as a custom strategy would create an empty custom strategy, which isn't useful.

### 9. Create Button Disabled State
- The Create button is disabled only when the selected strategy has scenarios AND none are selected. For empty built-in strategies, it's always enabled (provided a project name exists).
  - **Why:** Empty strategies should allow immediate project creation with the default scenario.

### 10. AI Tools Updated
- `listTemplatePacks` → `listStrategies`
- `create_from_pack` action → `create_from_strategy`
- All descriptions updated to use "strategy" terminology.
  - **Why:** Keep AI assistant consistent with the new UI terminology.

### 11. Duplicate Interfaces Found
- During editing, discovered that `TemplatePack` and `ScenarioTemplate` interfaces were duplicated in `app/types/index.ts` (old versions remained alongside the new `Strategy`/`StrategyScenario` ones).
  - **Fix:** Removed the duplicate old interfaces.

---

*Last updated: Implementation complete*
