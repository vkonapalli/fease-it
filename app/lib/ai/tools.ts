import { tool } from "ai";
import { z } from "zod";
import { createInputsForStrategy, getAllStrategies, createScenariosFromStrategy } from "~/lib/templates";
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

const OVERRIDE_PATHS = {
  property: {
    label: "Property",
    paths: {
      purchasePrice: { type: "number", desc: "Purchase price in AUD", example: "800000" },
      address: { type: "string", desc: "Street address", example: "'123 Main St'" },
      suburb: { type: "string", desc: "Suburb name", example: "'Richmond'" },
      postcode: { type: "string", desc: "Postcode", example: "'3121'" },
      location: { type: "string", desc: "Australian state", example: "'VIC'" },
      landArea: { type: "number", desc: "Land area in sqm", example: "600" },
    },
  },
  development: {
    label: "Development",
    paths: {
      numDwellings: { type: "number", desc: "Number of lots/dwellings", example: "2" },
      constructionCostPerSqm: { type: "number", desc: "Construction cost per sqm in AUD", example: "2500" },
      contingencyPercent: { type: "number", desc: "Contingency percentage", example: "5" },
    },
  },
  financing: {
    label: "Financing",
    paths: {
      lvr: { type: "number", desc: "Loan-to-value ratio", example: "70" },
      interestRate: { type: "number", desc: "Annual interest rate %", example: "6.5" },
      loanTermMonths: { type: "number", desc: "Loan term in months", example: "12" },
    },
  },
  revenue: {
    label: "Revenue",
    paths: {
      rentalIncomePerUnitPerWeek: { type: "number", desc: "Weekly rent per unit in AUD", example: "500" },
      capitalGrowthRate: { type: "number", desc: "Annual capital growth %", example: "3" },
      vacancyRate: { type: "number", desc: "Vacancy rate %", example: "5" },
    },
  },
  operating: {
    label: "Operating",
    paths: {
      holdPeriodYears: { type: "number", desc: "Hold period in years", example: "7" },
    },
  },
} as const;

type OverridePathDef = { type: string; desc: string; example: string };
type OverrideSection = { label: string; paths: Record<string, OverridePathDef> };

const FLAT_PATHS = Object.fromEntries(
  Object.entries(OVERRIDE_PATHS).flatMap(([section, def]: [string, OverrideSection]) =>
    Object.entries(def.paths).map(([key, pdef]) => [
      `${section}.${key}`,
      pdef,
    ] as const)
  )
);

function overridePathsRef(): string {
  let out = "";
  for (const [section, def] of Object.entries(OVERRIDE_PATHS)) {
    out += `${def.label} (${section}.*):\n`;
    for (const [key, pdef] of Object.entries(def.paths as Record<string, OverridePathDef>)) {
      out += `  ${section}.${key} — ${pdef.desc} (${pdef.type}, e.g. ${pdef.example})\n`;
    }
    out += "\n";
  }
  return out;
}

function overridePathExamples(): string {
  const paths = Object.entries(FLAT_PATHS).slice(0, 3);
  const obj: Record<string, unknown> = {};
  for (const [path, pdef] of paths) {
    const val = pdef.type === "string" ? pdef.example : Number(pdef.example);
    obj[path] = val;
  }
  return JSON.stringify(obj);
}

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
    if (!(path in FLAT_PATHS)) {
      console.warn(`[AI Override] Unknown path: "${path}". Allowed: ${Object.keys(FLAT_PATHS).join(", ")}`);
    }
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
    "Get the default feasibility inputs for a given project strategy. Returns the complete FeasibilityInputs object with sensible defaults. Use this when the user asks what defaults look like for a strategy.",
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
    "Run a feasibility calculation. You MUST provide overrides for EVERY value the user mentioned (purchase price, location, number of lots, LVR, interest rate, etc). " +
    "If the user said '$800k purchase in VIC', call with overrides: { 'property.purchasePrice': 800000, 'property.location': 'VIC' }. Available override paths:\n" +
    overridePathsRef(),
  inputSchema: z.object({
    strategy: scenarioSchema.describe(
      "The project scenario/strategy to evaluate: sell-all, sell-1-hold-1, rental-hold, land-plus-build, build-hold, sda-hold"
    ),
    overrides: z
      .record(z.string(), z.unknown())
      .describe(
        "REQUIRED. Dot-path overrides for every user-specified value. Examples: " +
        "{ 'property.purchasePrice': 800000, 'property.location': 'VIC' } or " +
        "{ 'property.purchasePrice': 1200000, 'development.numDwellings': 3, 'financing.lvr': 80 }"
      ),
  }),
  execute: async ({ strategy, overrides }) => {
    const baseInputs = createInputsForStrategy(strategy as ProjectScenario);
    const inputs = applyOverrides(baseInputs as unknown as Record<string, unknown>, overrides);
    const empty = Object.keys(overrides).length === 0;
    const result = summariseResult(inputs as unknown as FeasibilityInputs, strategy as ProjectScenario);
    if (empty) {
      return { warning: "No overrides were provided — using default inputs. If the user specified values (purchase price, location, etc.), you forgot to pass them. You MUST call this tool again with overrides populated.", ...result };
    }
    return result;
  },
});

export const listStrategies = tool({
  description:
    "List all built-in strategies. Strategies are collections of related scenarios that can be created together.",
  inputSchema: z.object({}),
  execute: async () => {
    const strategies = getAllStrategies();
    return strategies.map((p) => ({
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
    "Estimate the stamp duty (land transfer duty) for a property purchase in an Australian state. Use this when the user specifically asks about stamp duty or wants to know the duty amount for a given price and state.",
  inputSchema: z.object({
    state: z
      .enum(["VIC", "NSW", "QLD", "SA", "WA", "TAS", "ACT", "NT"])
      .describe("Australian state/territory"),
    purchasePrice: z.number().min(0).describe("Property purchase price in AUD (e.g. 800000 for $800k)"),
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

export const runCalculation = tool({
  description:
    "Write and execute JavaScript to perform calculations, financial analysis, or data transformations. Use for ad-hoc math, formulas, comparisons, or any computation the other tools don't cover. The last evaluated expression is returned as the result. You have access to Math, Date, JSON, and all standard JavaScript globals. Use console.log() to print intermediate values for debugging — the output will be captured.",
  inputSchema: z.object({
    code: z.string().describe(
      "JavaScript code to execute. Can be a single expression or a multi-line block. Use arrow functions or IIFEs for complex logic. Variables inside the block are scoped locally. Examples:\n" +
      "- '800000 * 0.055' — simple expression\n" +
      "- '(500 * 52) / 800000 * 100' — rental yield %\n" +
      "- '(() => { const loan = 800000 * 0.7; const monthly = loan * 0.065 / 12; return { loan, monthly, annualCost: monthly * 12 }; })()' — IIFE for multi-step\n" +
      "- '1200000 * 0.8 / 52' — weekly rent at 8% yield\n" +
      "- Use console.log(x) to debug intermediate values"
    ),
    context: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Optional variables to inject into the code scope. Pass results from previous tool calls here."),
  }),
  execute: async ({ code, context = {} }) => {
    const logs: string[] = [];
    const sandbox: Record<string, unknown> = {
      Math, Number, String, Array, Object, Date, JSON, Boolean, RegExp, Map, Set,
      parseInt, parseFloat, isNaN, isFinite, Infinity, NaN, undefined,
      console: {
        log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
        warn: (...args: unknown[]) => logs.push("[warn] " + args.map(String).join(" ")),
        error: (...args: unknown[]) => logs.push("[error] " + args.map(String).join(" ")),
      },
      ...context,
    };

    const argNames = Object.keys(sandbox);
    const argValues = Object.values(sandbox);

    try {
      const wrappedCode = `"use strict"; return (${code});`;
      const fn = new Function(...argNames, wrappedCode);
      const result = fn(...argValues);
      return logs.length > 0 ? { result, logs } : { result };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack?.split("\n").slice(0, 3).join("\n") : undefined;
      return { error: message, stack, code, logs: logs.length > 0 ? logs : undefined };
    }
  },
});

export const applyProjectActions = tool({
  description:
    "Create scenarios, update inputs, or load strategies in the user's project. Call this EXACTLY ONCE when the user wants to modify the project. Combine multiple actions into one call when possible. After calling, confirm what was done in plain English.",
  inputSchema: z.object({
    actions: z
      .array(
        z.discriminatedUnion("type", [
          z.object({
            type: z.literal("create_scenario"),
            name: z.string().optional().describe("Descriptive name (e.g. 'Sell All - 800k VIC')"),
            strategy: scenarioSchema.describe("The strategy to use"),
            overrides: z
              .record(z.string(), z.unknown())
              .describe(
                "REQUIRED. Dot-path overrides for every user-specified value. " +
                "Example: { 'property.purchasePrice': 800000, 'property.location': 'VIC' }"
              ),
          }),
          z.object({
            type: z.literal("update_inputs"),
            changes: z
              .record(z.string(), z.unknown())
              .describe("Dot-path key-value pairs to merge into the current scenario's inputs"),
          }),
          z.object({
            type: z.literal("create_from_strategy"),
            strategyId: z.string().describe("Strategy ID from listStrategies"),
            selectedIds: z
              .array(z.string())
              .describe("Scenario IDs from the strategy to create (all if user wants all)"),
          }),
        ])
      )
      .describe("Actions to apply. Batch related actions into one call."),
  }),
  execute: async ({ actions }) => {
    return {
      applied: true,
      actions,
      message: "Actions will be applied by the client. Confirm to the user what was done.",
    };
  },
});

type ActionItem =
  | { type: "create_scenario"; name?: string; strategy: string; overrides: Record<string, unknown> }
  | { type: "update_inputs"; changes: Record<string, unknown> }
  | { type: "create_from_strategy"; strategyId: string; selectedIds: string[] };

export function resolveActions(actions: ActionItem[]) {
  const resolved: Array<{
    type: string;
    name: string;
    inputs?: FeasibilityInputs;
    strategy?: ProjectScenario;
    changes?: Record<string, unknown>;
    strategyId?: string;
    selectedIds?: string[];
  }> = [];

  for (const action of actions) {
    if (action.type === "create_scenario") {
      const strategy = action.strategy as ProjectScenario;
      const baseInputs = createInputsForStrategy(strategy);
      const inputs = applyOverrides(
        baseInputs as unknown as Record<string, unknown>,
        action.overrides
      ) as unknown as FeasibilityInputs;
      resolved.push({
        type: "create_scenario",
        name: action.name || `New ${strategy}`,
        inputs,
        strategy,
      });
    } else if (action.type === "update_inputs") {
      resolved.push({
        type: "update_inputs",
        name: "Update Inputs",
        changes: action.changes,
      });
    } else if (action.type === "create_from_strategy") {
      resolved.push({
        type: "create_from_strategy",
        name: "Create from Strategy",
        strategyId: action.strategyId,
        selectedIds: action.selectedIds,
      });
    }
  }

  return resolved;
}

export const SYSTEM_PROMPT = `You are an AI assistant for Fease-It, an Australian property feasibility analysis tool. You help users create and evaluate property development scenarios.

## Available Tools
- **calculateScenarioSummary**: Run a feasibility calculation with user's values. Returns profit, costs, revenue, etc. Use this for "what does this look like?" questions.
- **getInputsForStrategy**: Get default inputs for a strategy (rarely needed).
- **estimateStampDuty**: Calculate Australian stamp duty.
- **listStrategies**: List available strategies.
- **runCalculation**: Execute JavaScript for ad-hoc financial math (yield, ROI, loan payments, compound growth).
- **applyProjectActions**: Create/update scenarios in the project. Call this when the user wants to actually make changes.

## Strategy Types
- **sell-all**: Sell all lots at completion for immediate profit
- **sell-1-hold-1**: Sell one lot, hold one for rental income and growth
- **rental-hold**: Hold all lots for rental income and long-term appreciation
- **land-plus-build**: Sell one raw lot, build and hold the other
- **build-hold**: Build dwellings on all lots and hold for rental
- **sda-hold**: NDIS Specialist Disability Accommodation with high-yield rental

## Override Paths
When the user specifies values, you MUST pass them as overrides. Never pass empty overrides.

${overridePathsRef()}
## CRITICAL Rules
1. **Always populate overrides**: If the user said "$800k purchase in VIC", call calculateScenarioSummary with { "property.purchasePrice": 800000, "property.location": "VIC" } — NOT with empty overrides.
2. **One call**: Call calculateScenarioSummary ONCE with all user values. Then call applyProjectActions ONCE if the user wants to create things.
3. **runCalculation for ad-hoc math**: Use runCalculation for yield calculations, ROI, loan payments, compound growth, and any financial math the other tools don't cover.
4. **Convert values**: "$800k" = 800000, "6.5%" = 6.5, "$1.2M" = 1200000. Strings need quotes, numbers and booleans do not.
5. **States**: VIC, NSW, QLD, SA, WA, TAS, ACT, NT
6. **Be concise**: Show key metrics ($ profit, margin %, cash required) in a brief summary.
7. **Never guess numbers**: Always use the tools.`;
