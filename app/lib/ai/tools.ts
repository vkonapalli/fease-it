import { tool } from "ai";
import { z } from "zod";
import { createInputsForStrategy, getAllPacks, createScenariosFromPack } from "~/lib/templates";
import { calculateScenario } from "~/lib/calculations";
import { calculateStampDuty } from "~/lib/calculations/stampDuty";
import type { FeasibilityInputs, ProjectScenario } from "~/types";

const PROJECT_SCENARIOS = [
  "sell-all",
  "sell-1-hold-1",
  "rental-hold",
  "land-plus-build",
  "build-hold",
  "sda-hold",
] as const;

const scenarioSchema = z.enum(PROJECT_SCENARIOS);

const strategyDescriptions: Record<ProjectScenario, string> = {
  "sell-all": "Sell all lots at completion for immediate profit. No units held.",
  "sell-1-hold-1": "Sell one lot to recoup capital, hold one for rental income and capital growth.",
  "rental-hold": "Hold all lots for rental income and long-term capital appreciation.",
  "land-plus-build": "Sell one raw lot, build a dwelling on the other and hold for rental.",
  "build-hold": "Build dwellings on all lots and hold for rental income.",
  "sda-hold": "NDIS Specialist Disability Accommodation — build SDA-compliant dwellings and hold for NDIS rental income.",
};

export function setDeep(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== "object" || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

export function applyOverrides<T extends Record<string, unknown>>(
  obj: T,
  overrides: Record<string, unknown>
): T {
  const result = structuredClone(obj) as Record<string, unknown>;
  for (const [path, value] of Object.entries(overrides)) {
    setDeep(result, path, value);
  }
  return result as T;
}

function summariseResult(inputs: FeasibilityInputs, scenario: ProjectScenario) {
  const result = calculateScenario(inputs, scenario);

  return {
    scenario,
    scenarioName: result.scenarioName,
    totalRevenue: result.totalRevenue,
    totalCosts: result.totalCosts,
    profit: result.profit,
    profitMargin: result.profitMargin,
    profitOnCost: result.profitOnCost,
    cashRequired: result.cashRequired,
    loanAmount: result.loanAmount,
    equityRequired: result.equityRequired,
    annualRentalIncome: result.annualRentalIncome ?? 0,
    numberOfLots: inputs.development.numDwellings,
    lotPrices: inputs.development.lots.map((l) => ({ name: l.name, price: l.salePrice, isHeld: l.isHeld })),
    constructionCostPerSqm: inputs.development.constructionCostPerSqm,
    contingencyPercent: inputs.development.contingencyPercent,
    lvr: inputs.financing.lvr,
    interestRate: inputs.financing.interestRate,
    loanTermMonths: inputs.financing.loanTermMonths,
    holdPeriodYears: inputs.operating.holdPeriodYears,
    rentalIncomePerWeek: inputs.revenue.rentalIncomePerUnitPerWeek,
    vacancyRate: inputs.revenue.vacancyRate,
  };
}

export const getInputsForStrategy = tool({
  description:
    "Get the default feasibility inputs for a given project strategy. Returns the complete FeasibilityInputs object with sensible defaults that can be overridden.",
  inputSchema: z.object({
    strategy: scenarioSchema.describe("The project scenario/strategy to get defaults for"),
  }),
  execute: async ({ strategy }) => {
    const inputs = createInputsForStrategy(strategy as ProjectScenario);
    return {
      strategy,
      description: strategyDescriptions[strategy as ProjectScenario],
      inputs: inputs as unknown as Record<string, unknown>,
    };
  },
});

export const calculateScenarioSummary = tool({
  description:
    "Create default inputs for a strategy, apply the given overrides, and run a feasibility calculation. Returns key financial metrics. Use this to show the user what a scenario would look like before creating it.",
  inputSchema: z.object({
    strategy: scenarioSchema.describe("The project scenario/strategy to evaluate"),
    overrides: z
      .record(z.string(), z.unknown())
      .optional()
      .describe(
        "Optional dot-path overrides for the default inputs, e.g. { 'property.purchasePrice': 850000, 'property.address': '123 Main St', 'property.location': 'VIC', 'development.numDwellings': 3, 'financing.lvr': 80 }. Only specify fields the user wants changed."
      ),
  }),
  execute: async ({ strategy, overrides = {} }) => {
    const baseInputs = createInputsForStrategy(strategy as ProjectScenario);
    const inputs = applyOverrides(baseInputs as unknown as Record<string, unknown>, overrides);
    return summariseResult(inputs as unknown as FeasibilityInputs, strategy as ProjectScenario);
  },
});

export const listTemplatePacks = tool({
  description:
    "List all built-in template packs and their included scenarios. Template packs are collections of related scenarios that can be created together.",
  inputSchema: z.object({}),
  execute: async () => {
    const packs = getAllPacks();
    return packs.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      isBuiltIn: p.isBuiltIn,
      scenarios: p.scenarios.map((s) => ({
        id: s.id,
        name: s.name,
        strategy: s.strategy,
        description: s.description,
      })),
    }));
  },
});

export const estimateStampDuty = tool({
  description:
    "Estimate the stamp duty (land transfer duty) for a property purchase in an Australian state.",
  inputSchema: z.object({
    state: z.enum(["VIC", "NSW", "QLD", "SA", "WA", "TAS", "ACT", "NT"]).describe("Australian state/territory"),
    purchasePrice: z.number().min(0).describe("Property purchase price in AUD"),
  }),
  execute: async ({ state, purchasePrice }) => {
    const duty = calculateStampDuty(state, purchasePrice);
    return {
      state,
      purchasePrice,
      stampDuty: duty,
      effectiveRate: purchasePrice > 0 ? (duty / purchasePrice) * 100 : 0,
    };
  },
});

export const applyProjectActions = tool({
  description:
    "Apply state changes to the project. Call this tool when the user wants to create scenarios, update inputs, or set up template packs. After calling this, you will receive confirmation of what was applied. Always call this tool when the user expresses intent to modify the project.",
  inputSchema: z.object({
    actions: z.array(
      z.object({
        type: z
          .enum(["create_scenario", "update_inputs", "create_from_pack"])
          .describe("The type of action to perform"),
        name: z
          .string()
          .optional()
          .describe("For create_scenario: the name of the new scenario"),
        strategy: scenarioSchema
          .optional()
          .describe("For create_scenario: the strategy to use"),
        overrides: z
          .record(z.string(), z.unknown())
          .optional()
          .describe(
            "For create_scenario: dot-path overrides for the strategy's default inputs"
          ),
        changes: z
          .record(z.string(), z.unknown())
          .optional()
          .describe(
            "For update_inputs: dot-path key-value pairs to merge into the current scenario's inputs"
          ),
        packId: z
          .string()
          .optional()
          .describe("For create_from_pack: the template pack ID"),
        selectedIds: z
          .array(z.string())
          .optional()
          .describe("For create_from_pack: which scenario IDs from the pack to create"),
      })
    ).describe("One or more actions to apply to the project"),
  }),
  execute: async ({ actions }) => {
    return {
      applied: true,
      actions,
      message: "Actions will be applied by the client. Confirm to the user what was done.",
    };
  },
});

export function resolveActions(actions: Array<{
  type: string;
  name?: string;
  strategy?: string;
  overrides?: Record<string, unknown>;
  changes?: Record<string, unknown>;
  packId?: string;
  selectedIds?: string[];
}>) {
  const resolved: Array<{
    type: string;
    name: string;
    inputs?: FeasibilityInputs;
    strategy?: ProjectScenario;
    changes?: Record<string, unknown>;
    packId?: string;
    selectedIds?: string[];
  }> = [];

  for (const action of actions) {
    if (action.type === "create_scenario" && action.strategy) {
      const strategy = action.strategy as ProjectScenario;
      const baseInputs = createInputsForStrategy(strategy);
      const inputs = action.overrides
        ? (applyOverrides(baseInputs as unknown as Record<string, unknown>, action.overrides) as unknown as FeasibilityInputs)
        : baseInputs;
      resolved.push({
        type: "create_scenario",
        name: action.name || `New ${strategy}`,
        inputs,
        strategy,
      });
    } else if (action.type === "update_inputs" && action.changes) {
      resolved.push({
        type: "update_inputs",
        name: "Update Inputs",
        changes: action.changes,
      });
    } else if (action.type === "create_from_pack" && action.packId && action.selectedIds) {
      resolved.push({
        type: "create_from_pack",
        name: "Create from Pack",
        packId: action.packId,
        selectedIds: action.selectedIds,
      });
    }
  }

  return resolved;
}

export const SYSTEM_PROMPT = `You are an AI assistant for Fease-It, an Australian property feasibility analysis tool. You help users create and evaluate property development scenarios.

## Your Capabilities
- Get default inputs for any of the 6 project strategies (sell-all, sell-1-hold-1, rental-hold, land-plus-build, build-hold, sda-hold)
- Run feasibility calculations to show profit, costs, revenue, and key metrics
- List template packs (collections of related scenarios)
- Estimate Australian stamp duty for any state
- Apply changes to the project: create scenarios, update inputs, or load template packs

## Strategy Descriptions
- **sell-all**: Sell all lots at completion for immediate profit
- **sell-1-hold-1**: Sell one lot, hold one for rental income and capital growth
- **rental-hold**: Hold all lots for rental income and long-term appreciation
- **land-plus-build**: Sell one raw lot, build and hold the other
- **build-hold**: Build dwellings on all lots and hold for rental
- **sda-hold**: NDIS Specialist Disability Accommodation with high-yield rental

## How to Work
1. When a user asks to create or check a feasibility:
   - Use getInputsForStrategy to get default inputs (optional)
   - Use calculateScenarioSummary with relevant overrides to show projected results
   - Use estimateStampDuty if the user asks about stamp duty
   - If the user wants to actually create/set up the scenario, call applyProjectActions
2. When a user asks about available options:
   - Use listTemplatePacks to show available packs
3. Overrides use dot-path notation: "property.purchasePrice", "financing.lvr", "development.numDwellings", etc.
4. Always explain what you found/created in plain English after using tools.
5. Be concise but informative. Show key metrics ($ profit, margin %, cash required).

## Important
- Always use the tools to get accurate data — never guess financial numbers.
- When the user expresses intent to create/modify things, ALWAYS call applyProjectActions.
- Australian states: VIC, NSW, QLD, SA, WA, TAS, ACT, NT
- Currency is AUD ($)`;
