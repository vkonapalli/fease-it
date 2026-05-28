import { FeasibilityInputsSchema } from "@fease-it/schemas";
import type { FeasibilityInputs, ProjectScenario, StrategyScenario, Strategy } from "@fease-it/schemas";

// ============================================================
// Base Template Inputs
// ============================================================

export function createBaseInputs(): FeasibilityInputs {
  return FeasibilityInputsSchema.parse({
    name: "New Property",
    scenario: "build-sell",
    property: {
      purchasePrice: 1000000,
      landArea: 1000,
      location: "VIC",
      address: "",
      suburb: "",
      postcode: "",
      costs: [
        { id: "buyers-fee", name: "Buyers / Finders Fee", amount: 2.5, isPercentage: true, gstTreatment: "inclusive" },
        { id: "accounting-legals", name: "Accounting & Legals", amount: 15000, isPercentage: false, gstTreatment: "inclusive" },
        { id: "closing-costs", name: "Closing Costs & Settlement", amount: 3000, isPercentage: false, gstTreatment: "inclusive" },
        { id: "due-diligence", name: "Due Diligence", amount: 5000, isPercentage: false, gstTreatment: "inclusive" },
      ],
      landTaxAuto: true,
      landValue: 1000000,
    },
    development: {
      numDwellings: 2,
      lots: [
        { id: 1, name: "Lot 1", salePrice: 600000, buildAreaSqm: 0, landAreaSqm: 500, isHeld: false, hasConstruction: false },
        { id: 2, name: "Lot 2", salePrice: 600000, buildAreaSqm: 0, landAreaSqm: 500, isHeld: false, hasConstruction: false },
      ],
      globalCosts: [
        { id: "town-planning", name: "Town Planning", amount: 0.6, isPercentage: true, applyPerLot: false, gstTreatment: "inclusive" },
        { id: "building-permits", name: "Building Permits", amount: 0.6, isPercentage: true, applyPerLot: false, gstTreatment: "inclusive" },
        { id: "land-surveying", name: "Land Surveying", amount: 0, isPercentage: false, applyPerLot: false, gstTreatment: "inclusive" },
        { id: "utilities-water", name: "Utilities — Water", amount: 0, isPercentage: false, applyPerLot: false, gstTreatment: "free" },
        { id: "utilities-electricity", name: "Utilities — Electricity", amount: 0, isPercentage: false, applyPerLot: false, gstTreatment: "free" },
        { id: "council-costs", name: "Council Costs", amount: 0, isPercentage: false, applyPerLot: false, gstTreatment: "free" },
        { id: "holding", name: "Holding Cost", amount: 0.5, isPercentage: true, applyPerLot: false, gstTreatment: "inclusive" },
        { id: "demo", name: "Demolition", amount: 0, isPercentage: false, applyPerLot: false, gstTreatment: "inclusive" },
        { id: "marketing", name: "Marketing & Selling", amount: 1.5, isPercentage: true, applyPerLot: false, gstTreatment: "inclusive" },
      ],
      constructionCostPerSqm: 2500,
      contingencyPercent: 5,
      timeline: {
        settlementDate: "",
        contractDate: "",
        timelineMonths: 12,
      },
      strategy: {
        strategyType: "sub-division",
        pricingModel: "average",
        minLots: null,
        maxLots: null,
        averagePricePerLot: 600000,
        averageBuildAreaPerLot: 0,
        pricePerSqm: 0,
        lotSizeGroups: [],
      },
      gstGlobalTreatment: "inclusive",
    },
    financing: {
      lvr: 70,
      interestRate: 6.5,
      loanTermMonths: 12,
      establishmentFeePercent: 0.475,
      brokerFeePercent: 0,
      settlementFee: 1000,
      deferredFeeMonths: 0,
      lvrBase: "net-grv",
      secondLvrBase: "net-grv",
    },
    revenue: {
      gst: { treatment: "gst-free", costBasePerLot: 500000 },
      capitalGrowthRate: 0.05,
      rentalIncomePerUnitPerWeek: 500,
      rentalGrowthRate: 0.03,
      vacancyRate: 0.05,
      rentalShadingPercent: 90,
      numUnitsForRent: 2,
      applyMarginScheme: false,
      salesCommissionType: "percentage",
      salesCommissionPercent: 1.5,
      salesCommissionFlat: 0,
    },
    operating: {
      costs: [
        { id: "council-rates", name: "Council Rates", annualAmount: 3000, isPercentageOfRent: false, escalationRate: 0.03 },
        { id: "insurance", name: "Insurance", annualAmount: 3000, isPercentageOfRent: false, escalationRate: 0.05 },
        { id: "landscaping", name: "Landscaping", annualAmount: 1200, isPercentageOfRent: false, escalationRate: 0 },
        { id: "repairs", name: "Repairs & Maintenance", annualAmount: 2000, isPercentageOfRent: false, escalationRate: 0.03 },
        { id: "prop-mgmt", name: "Property Management", annualAmount: 7.5, isPercentageOfRent: true, escalationRate: 0 },
        { id: "letting", name: "Letting Fee", annualAmount: 0, isPercentageOfRent: false, escalationRate: 0 },
        { id: "land-tax", name: "Land Tax", annualAmount: 0, isPercentageOfRent: false, escalationRate: 0 },
        { id: "accounting", name: "Accounting", annualAmount: 1000, isPercentageOfRent: false, escalationRate: 0 },
      ],
      holdPeriodYears: 7,
    },
    jv: {
      developerEquity: 0,
      investorProfitSharePercent: 50,
      developerProfitSharePercent: 50,
      rounds: [],
      moneyPartners: [],
    },
    cashflow: {
      frequency: "monthly",
      startDate: new Date().toISOString().split("T")[0],
      phases: [
        { id: "acquisition", name: "Acquisition", months: 1, costs: [
          { name: "Purchase Price", amount: 1000000, frequency: "once" },
          { name: "Stamp Duty", amount: 0, frequency: "once" },
          { name: "Legal & Settlement", amount: 18000, frequency: "once" },
        ], income: [
          { name: "Bank Loan", amount: 700000, frequency: "once" },
        ]},
        { id: "development", name: "Development", months: 6, costs: [
          { name: "Holding Costs", amount: 5000, frequency: "monthly" },
        ], income: []},
        { id: "sales", name: "Sales", months: 3, costs: [
          { name: "Marketing", amount: 5000, frequency: "monthly" },
          { name: "Commission", amount: 18000, frequency: "once" },
        ], income: [
          { name: "Sale Lot 1", amount: 600000, frequency: "once" },
          { name: "Sale Lot 2", amount: 600000, frequency: "once" },
        ]},
      ],
      overrides: [],
    },
    budgetVsActual: {
      items: [
        { id: "purchase", category: "Purchase Price", budget: 1000000, actual: 1000000, variance: 0, variancePercent: 0 },
        { id: "stamp", category: "Stamp Duty", budget: 0, actual: 0, variance: 0, variancePercent: 0 },
        { id: "finders", category: "Finders Fee", budget: 25000, actual: 25000, variance: 0, variancePercent: 0 },
        { id: "legals", category: "Accounting & Legals", budget: 15000, actual: 15000, variance: 0, variancePercent: 0 },
        { id: "funding", category: "Funding Cost", budget: 0, actual: 0, variance: 0, variancePercent: 0 },
        { id: "demo", category: "Demo", budget: 0, actual: 0, variance: 0, variancePercent: 0 },
      ],
      totalBudget: 0,
      totalActual: 0,
      totalVariance: 0,
    },
    sda: {
      units: 4,
      sdaBasicMonthly: 12180,
      rrcMonthly: 11858,
      ooaLeaseMonthly: 25622,
      sdaScenario: "full",
      landlordSharePercent: 92,
      providerFeePercent: 16,
      landlordGuaranteedAnnual: 140000,
      excessRevenueSplit: "50-50",
    },
    capitalStack: {
      privateLending: { amount: 0, isPercentageOfCost: false, interestRate: 0 },
      profitSharing: { amountCommitted: 0, percentOfTotalCapital: 0, percentOfProfit: 0 },
      developerEquity: { amount: 0, isAutoComputed: true },
      otherEquity: { amount: 0, isPercentageOfCost: false },
    },
    capitalSpread: [],
  });
}

// ============================================================
// Strategy-Specific Inputs
// ============================================================

export function createBuildSellInputs(): FeasibilityInputs {
  const base = createBaseInputs();
  return FeasibilityInputsSchema.parse({
    ...base,
    name: "Build & Sell",
    scenario: "build-sell",
    development: {
      ...base.development,
      lots: base.development.lots.map((l) => ({ ...l, isHeld: false, hasConstruction: false })),
    },
    revenue: {
      ...base.revenue,
      numUnitsForRent: 0,
    },
  });
}

export function createSell1Hold1Inputs(): FeasibilityInputs {
  const base = createBaseInputs();
  return FeasibilityInputsSchema.parse({
    ...base,
    name: "Sell 1, Hold 1",
    scenario: "sell-1-hold-1",
    development: {
      ...base.development,
      lots: base.development.lots.map((l, i) => ({
        ...l,
        isHeld: i === 0,
        hasConstruction: false,
      })),
    },
    revenue: {
      ...base.revenue,
      numUnitsForRent: 1,
    },
    cashflow: {
      ...base.cashflow,
      phases: [
        { ...base.cashflow.phases[0] },
        { ...base.cashflow.phases[1] },
        {
          ...base.cashflow.phases[2],
          income: [
            { name: "Sale Lot 2", amount: 600000, frequency: "once" },
          ],
        },
      ],
    },
  });
}

export function createRentalHoldInputs(): FeasibilityInputs {
  const base = createBaseInputs();
  return FeasibilityInputsSchema.parse({
    ...base,
    name: "Rental Hold",
    scenario: "rental-hold",
    development: {
      ...base.development,
      lots: base.development.lots.map((l) => ({ ...l, isHeld: true, hasConstruction: false })),
    },
    revenue: {
      ...base.revenue,
      numUnitsForRent: base.development.numDwellings,
    },
    cashflow: {
      ...base.cashflow,
      phases: [
        { ...base.cashflow.phases[0] },
        {
          id: "hold",
          name: "Holding Period",
          months: 84,
          costs: [
            { name: "Interest Payment", amount: 5417, frequency: "monthly" },
            { name: "Operating Costs", amount: 1500, frequency: "monthly" },
          ],
          income: [
            { name: "Rental Income", amount: 4333, frequency: "monthly" },
          ],
        },
      ],
    },
  });
}

export function createBuildHoldInputs(): FeasibilityInputs {
  const base = createBaseInputs();
  return FeasibilityInputsSchema.parse({
    ...base,
    name: "Build & Hold",
    scenario: "build-hold",
    development: {
      ...base.development,
      strategy: {
        ...base.development.strategy,
        strategyType: "townhouse",
      },
      lots: base.development.lots.map((l) => ({
        ...l,
        buildAreaSqm: 180,
        isHeld: true,
        hasConstruction: true,
      })),
    },
    revenue: {
      ...base.revenue,
      numUnitsForRent: base.development.numDwellings,
    },
    cashflow: {
      ...base.cashflow,
      phases: [
        { ...base.cashflow.phases[0] },
        {
          id: "construction",
          name: "Construction",
          months: 12,
          costs: [
            { name: "Construction", amount: 90000, frequency: "monthly" },
            { name: "Holding Costs", amount: 5000, frequency: "monthly" },
          ],
          income: [],
        },
        {
          id: "hold",
          name: "Holding Period",
          months: 72,
          costs: [
            { name: "Interest Payment", amount: 5417, frequency: "monthly" },
            { name: "Operating Costs", amount: 2000, frequency: "monthly" },
          ],
          income: [
            { name: "Rental Income", amount: 6500, frequency: "monthly" },
          ],
        },
      ],
    },
  });
}

export function createLandPlusBuildInputs(): FeasibilityInputs {
  const base = createBaseInputs();
  return FeasibilityInputsSchema.parse({
    ...base,
    name: "Land + Build",
    scenario: "land-plus-build",
    development: {
      ...base.development,
      strategy: {
        ...base.development.strategy,
        strategyType: "townhouse",
      },
      lots: base.development.lots.map((l, i) => ({
        ...l,
        buildAreaSqm: i === 1 ? 180 : 0,
        isHeld: i === 1,
        hasConstruction: i === 1,
      })),
    },
    revenue: {
      ...base.revenue,
      numUnitsForRent: 1,
    },
    cashflow: {
      ...base.cashflow,
      phases: [
        { ...base.cashflow.phases[0] },
        {
          id: "construction",
          name: "Construction",
          months: 12,
          costs: [
            { name: "Construction", amount: 45000, frequency: "monthly" },
            { name: "Holding Costs", amount: 5000, frequency: "monthly" },
          ],
          income: [],
        },
        {
          id: "sales-hold",
          name: "Sales & Hold",
          months: 3,
          costs: [
            { name: "Marketing", amount: 5000, frequency: "monthly" },
            { name: "Commission", amount: 9000, frequency: "once" },
          ],
          income: [
            { name: "Sale Lot 1", amount: 600000, frequency: "once" },
          ],
        },
      ],
    },
  });
}

export function createSDAHoldInputs(): FeasibilityInputs {
  const base = createBaseInputs();
  return FeasibilityInputsSchema.parse({
    ...base,
    name: "SDA Hold",
    scenario: "sda-hold",
    development: {
      ...base.development,
      numDwellings: 4,
      strategy: {
        ...base.development.strategy,
        strategyType: "townhouse",
      },
      lots: [
        { id: 1, name: "Unit 1", salePrice: 0, buildAreaSqm: 200, landAreaSqm: 250, isHeld: true, hasConstruction: true },
        { id: 2, name: "Unit 2", salePrice: 0, buildAreaSqm: 200, landAreaSqm: 250, isHeld: true, hasConstruction: true },
        { id: 3, name: "Unit 3", salePrice: 0, buildAreaSqm: 200, landAreaSqm: 250, isHeld: true, hasConstruction: true },
        { id: 4, name: "Unit 4", salePrice: 0, buildAreaSqm: 200, landAreaSqm: 250, isHeld: true, hasConstruction: true },
      ],
    },
    revenue: {
      ...base.revenue,
      numUnitsForRent: 4,
      rentalIncomePerUnitPerWeek: 1200,
    },
    cashflow: {
      ...base.cashflow,
      phases: [
        { ...base.cashflow.phases[0] },
        {
          id: "construction",
          name: "Construction",
          months: 12,
          costs: [
            { name: "Construction", amount: 166667, frequency: "monthly" },
            { name: "Holding Costs", amount: 8000, frequency: "monthly" },
          ],
          income: [],
        },
        {
          id: "hold",
          name: "SDA Holding Period",
          months: 72,
          costs: [
            { name: "Interest Payment", amount: 5417, frequency: "monthly" },
            { name: "Operating Costs", amount: 4000, frequency: "monthly" },
          ],
          income: [
            { name: "SDA Rental Income", amount: 20800, frequency: "monthly" },
          ],
        },
      ],
    },
  });
}

// ============================================================
// Built-In Strategies
// ============================================================

export const BUILT_IN_STRATEGIES: Strategy[] = [
  {
    id: "land-subdivision",
    name: "Land Subdivision",
    description: "Land subdivision projects with the flexibility to add your own scenarios.",
    isBuiltIn: true,
    scenarios: [],
  },
  {
    id: "build-hold",
    name: "Build & Hold",
    description: "Build dwellings and hold for rental income and long-term capital growth.",
    isBuiltIn: true,
    scenarios: [],
  },
  {
    id: "build-sell",
    name: "Build & Sell",
    description: "Build dwellings and sell at completion for immediate profit.",
    isBuiltIn: true,
    scenarios: [],
  },
];

// ============================================================
// Helpers
// ============================================================

export function getAllStrategies(customStrategies: Strategy[] = []): Strategy[] {
  return [...BUILT_IN_STRATEGIES, ...customStrategies];
}

export function getStrategyById(id: string, customStrategies: Strategy[] = []): Strategy | undefined {
  return getAllStrategies(customStrategies).find((p) => p.id === id);
}

export function createScenariosFromStrategy(
  strategy: Strategy,
  selectedScenarioIds: string[]
): { name: string; inputs: FeasibilityInputs }[] {
  return strategy.scenarios
    .filter((s) => selectedScenarioIds.includes(s.id))
    .map((s) => ({
      name: s.name,
      inputs: s.inputs,
    }));
}

const STRATEGY_CREATORS: Record<ProjectScenario, () => FeasibilityInputs> = {
  "build-sell": createBuildSellInputs,
  "sell-1-hold-1": createSell1Hold1Inputs,
  "rental-hold": createRentalHoldInputs,
  "land-plus-build": createLandPlusBuildInputs,
  "build-hold": createBuildHoldInputs,
  "sda-hold": createSDAHoldInputs,
};

export function createInputsForStrategy(strategy: ProjectScenario): FeasibilityInputs {
  return STRATEGY_CREATORS[strategy]();
}

export function createStrategyScenario(
  strategy: ProjectScenario,
  overrides?: Partial<StrategyScenario>
): StrategyScenario {
  const inputs = createInputsForStrategy(strategy);
  const strategyNames: Record<ProjectScenario, string> = {
    "build-sell": "Build & Sell",
    "sell-1-hold-1": "Sell 1, Hold 1",
    "rental-hold": "Rental Hold",
    "land-plus-build": "Land + Build",
    "build-hold": "Build & Hold",
    "sda-hold": "SDA Hold",
  };
  const strategyDescriptions: Record<ProjectScenario, string> = {
    "build-sell": "Build and sell dwellings at completion.",
    "sell-1-hold-1": "Sell one lot, hold one for rental.",
    "rental-hold": "Hold all lots for rental income.",
    "land-plus-build": "Sell one raw lot, build and hold on the other.",
    "build-hold": "Build dwellings and hold for rent.",
    "sda-hold": "SDA disability housing with NDIS funding.",
  };
  return {
    id: overrides?.id ?? `scenario-${crypto.randomUUID()}`,
    name: overrides?.name ?? strategyNames[strategy],
    strategy,
    description: overrides?.description ?? strategyDescriptions[strategy],
    inputs: overrides?.inputs ?? inputs,
  };
}
