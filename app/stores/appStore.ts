import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FeasibilityInputs } from "~/types";

export interface Scenario {
  id: string;
  name: string;
  inputs: FeasibilityInputs;
  sortOrder: number;
  // synced indicates whether this scenario has been persisted to Supabase
  synced: boolean;
  // remoteId is the UUID from Supabase (null if only local)
  remoteId: string | null;
}

interface AppState {
  // Project
  projectId: string | null;
  projectName: string;
  setProject: (id: string | null, name: string) => void;

  // Scenarios
  scenarios: Scenario[];
  activeScenarioId: string | null;
  addScenario: (scenario: Scenario) => void;
  updateScenario: (id: string, updates: Partial<Omit<Scenario, "id">>) => void;
  removeScenario: (id: string) => void;
  setActiveScenario: (id: string) => void;
  duplicateScenario: (id: string) => void;
  duplicateScenarioWithOptions: (
    id: string,
    name: string,
    options: {
      copyProperty: boolean;
      copyDevelopment: boolean;
      copyFinancing: boolean;
      copyRevenue: boolean;
      copyOperating: boolean;
      copyJV: boolean;
      copyCashflow: boolean;
      copyBudget: boolean;
    }
  ) => void;
  setScenarios: (scenarios: Scenario[]) => void;
  getActiveScenario: () => Scenario | null;
  getActiveInputs: () => FeasibilityInputs | null;
  updateActiveInputs: (inputs: Partial<FeasibilityInputs>) => void;

  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

function createDefaultInputs(): FeasibilityInputs {
  return {
    name: "657A Nepean Hwy",
    scenario: "sell-all",
    property: {
      purchasePrice: 2760000,
      landArea: 1295,
      location: "VIC",
      address: "657A Nepean Highway",
      suburb: "Frankston South",
      postcode: "3199",
      costs: [
        { id: "buyers-fee", name: "Buyers / Finders Fee", amount: 40000, isPercentage: false, gstTreatment: "inclusive" },
        { id: "accounting-legals", name: "Accounting & Legals", amount: 15000, isPercentage: false, gstTreatment: "inclusive" },
        { id: "closing-costs", name: "Closing Costs & Settlement", amount: 3000, isPercentage: false, gstTreatment: "inclusive" },
        { id: "due-diligence", name: "Due Diligence", amount: 5000, isPercentage: false, gstTreatment: "inclusive" },
      ],
    },
    development: {
      numDwellings: 2,
      lots: [
        { id: 1, name: "Block 44", salePrice: 1775000, buildAreaSqm: 0, landAreaSqm: 647.5, isHeld: false, hasConstruction: false },
        { id: 2, name: "Block 92", salePrice: 1775000, buildAreaSqm: 0, landAreaSqm: 647.5, isHeld: false, hasConstruction: false },
      ],
      globalCosts: [
        { id: "town-planning", name: "Town Planning", amount: 0.6, isPercentage: true, applyPerLot: false, gstTreatment: "inclusive" },
        { id: "building-permits", name: "Building Permits", amount: 0.6, isPercentage: true, applyPerLot: false, gstTreatment: "inclusive" },
        { id: "land-surveying", name: "Land Surveying", amount: 0, isPercentage: false, applyPerLot: false, gstTreatment: "inclusive" },
        { id: "utilities-water", name: "Utilities — Water", amount: 0, isPercentage: false, applyPerLot: false, gstTreatment: "free" },
        { id: "utilities-electricity", name: "Utilities — Electricity", amount: 0, isPercentage: false, applyPerLot: false, gstTreatment: "free" },
        { id: "council-costs", name: "Council Costs", amount: 0, isPercentage: false, applyPerLot: false, gstTreatment: "free" },
        { id: "holding", name: "Holding Cost", amount: 0.5, isPercentage: true, applyPerLot: false, gstTreatment: "inclusive" },
        { id: "demo", name: "Demolition", amount: 60000, isPercentage: false, applyPerLot: false, gstTreatment: "inclusive" },
        { id: "marketing", name: "Marketing & Selling", amount: 1.5, isPercentage: true, applyPerLot: false, gstTreatment: "inclusive" },
      ],
      constructionCostPerSqm: 2430,
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
        averagePricePerLot: 1775000,
        pricePerSqm: 0,
        lotSizeGroups: [],
      },
      gstGlobalTreatment: "inclusive",
    },
    financing: {
      lvr: 70,
      interestRate: 6.14,
      loanTermMonths: 12,
      establishmentFeePercent: 0.475,
      brokerFeePercent: 0,
      settlementFee: 1000,
      deferredFeeMonths: 0,
      lvrBase: "net-grv",
      secondLvrBase: "net-grv",
    },
    revenue: {
      gst: { treatment: "gst-free", costBasePerLot: 1380000 },
      capitalGrowthRate: 0.05,
      rentalIncomePerUnitPerWeek: 360,
      rentalGrowthRate: 0.05,
      vacancyRate: 0.05,
      rentalShadingPercent: 90,
      numUnitsForRent: 10,
      applyMarginScheme: false,
      salesCommissionType: "percentage",
      salesCommissionPercent: 1.5,
      salesCommissionFlat: 0,
    },
    operating: {
      costs: [
        { id: "council-rates", name: "Council Rates", annualAmount: 12720, isPercentageOfRent: false, escalationRate: 0.03 },
        { id: "insurance", name: "Insurance", annualAmount: 6000, isPercentageOfRent: false, escalationRate: 0.05 },
        { id: "landscaping", name: "Landscaping", annualAmount: 3600, isPercentageOfRent: false, escalationRate: 0 },
        { id: "repairs", name: "Repairs & Maintenance", annualAmount: 6180, isPercentageOfRent: false, escalationRate: 0.03 },
        { id: "prop-mgmt", name: "Property Management", annualAmount: 6, isPercentageOfRent: true, escalationRate: 0 },
        { id: "letting", name: "Letting Fee", annualAmount: 0, isPercentageOfRent: false, escalationRate: 0 },
        { id: "land-tax", name: "Land Tax", annualAmount: 29000, isPercentageOfRent: false, escalationRate: 0 },
        { id: "accounting", name: "Accounting", annualAmount: 1000, isPercentageOfRent: false, escalationRate: 0 },
      ],
      holdPeriodYears: 7,
    },
    jv: {
      developerEquity: 0,
      investorProfitSharePercent: 60.35,
      developerProfitSharePercent: 39.65,
      rounds: [
        { id: "round-1", name: "Round 1 Capital Raising", totalRaised: 800000, investors: [
          { id: "vish", name: "Vish Associates", amount: 600000 },
          { id: "sharath", name: "Sharath Reddy", amount: 195000 },
          { id: "arvr", name: "ARVR Holdings", amount: 200000 },
        ]},
        { id: "round-2", name: "Round 2 Capital Raising", totalRaised: 200000, investors: [
          { id: "round2-inv", name: "Round 2 Investors", amount: 200000 },
        ]},
      ],
      moneyPartners: [
        { id: "ramakanth", name: "Ramakanth", amount: 150000, interestRate: 15, monthsLoaned: 5 },
      ],
    },
    cashflow: {
      frequency: "monthly",
      startDate: "2026-01-01",
      phases: [
        { id: "acquisition", name: "Acquisition", months: 1, costs: [
          { name: "Purchase Price", amount: 2760000, frequency: "once" },
          { name: "Stamp Duty", amount: 179400, frequency: "once" },
          { name: "Legal & Settlement", amount: 18000, frequency: "once" },
        ], income: [
          { name: "Bank Loan", amount: 1932000, frequency: "once" },
          { name: "Investor Capital", amount: 995000, frequency: "once" },
        ]},
        { id: "development", name: "Development", months: 3, costs: [
          { name: "Demolition", amount: 20000, frequency: "monthly" },
          { name: "Holding Costs", amount: 5000, frequency: "monthly" },
        ], income: []},
        { id: "sales", name: "Sales", months: 3, costs: [
          { name: "Marketing", amount: 5000, frequency: "monthly" },
          { name: "Commission", amount: 15000, frequency: "once" },
        ], income: [
          { name: "Sale Block 1", amount: 1775000, frequency: "once" },
          { name: "Sale Block 2", amount: 1775000, frequency: "once" },
        ]},
      ],
      overrides: [],
    },
    budgetVsActual: {
      items: [
        { id: "purchase", category: "Purchase Price", budget: 2760000, actual: 2760000, variance: 0, variancePercent: 0 },
        { id: "stamp", category: "Stamp Duty", budget: 165600, actual: 163297.63, variance: -2302.37, variancePercent: -1.39 },
        { id: "finders", category: "Finders Fee", budget: 40000, actual: 40000, variance: 0, variancePercent: 0 },
        { id: "legals", category: "Accounting & Legals", budget: 15000, actual: 7179.36, variance: -7820.64, variancePercent: -52.14 },
        { id: "funding", category: "Funding Cost", budget: 22252, actual: 19454, variance: -2798, variancePercent: -12.57 },
        { id: "demo", category: "Demo", budget: 80000, actual: 40000, variance: -40000, variancePercent: -50 },
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
  };
}

function createDefaultScenario(): Scenario {
  return {
    id: crypto.randomUUID(),
    name: "Scenario 1",
    inputs: createDefaultInputs(),
    sortOrder: 0,
    synced: false,
    remoteId: null,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Project
      projectId: null,
      projectName: "",
      setProject: (id, name) => set({ projectId: id, projectName: name }),

      // Scenarios
      scenarios: [createDefaultScenario()],
      activeScenarioId: null,

      addScenario: (scenario) =>
        set((state) => ({
          scenarios: [...state.scenarios, scenario],
          activeScenarioId: scenario.id,
        })),

      updateScenario: (id, updates) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) =>
            s.id === id ? { ...s, ...updates, synced: false } : s
          ),
        })),

      removeScenario: (id) =>
        set((state) => {
          const filtered = state.scenarios.filter((s) => s.id !== id);
          const newActive =
            state.activeScenarioId === id
              ? filtered[0]?.id ?? null
              : state.activeScenarioId;
          return { scenarios: filtered, activeScenarioId: newActive };
        }),

      setActiveScenario: (id) => set({ activeScenarioId: id }),

      duplicateScenario: (id) =>
        set((state) => {
          const source = state.scenarios.find((s) => s.id === id);
          if (!source) return state;
          const copy: Scenario = {
            ...source,
            id: crypto.randomUUID(),
            name: `${source.name} (Copy)`,
            sortOrder: Math.max(...state.scenarios.map((s) => s.sortOrder), 0) + 1,
            synced: false,
            remoteId: null,
          };
          return {
            scenarios: [...state.scenarios, copy],
            activeScenarioId: copy.id,
          };
        }),

      duplicateScenarioWithOptions: (id, name, options) =>
        set((state) => {
          const source = state.scenarios.find((s) => s.id === id);
          if (!source) return state;

          const defaults = createDefaultInputs();
          const src = source.inputs;

          const newInputs: FeasibilityInputs = {
            name,
            scenario: src.scenario,
            property: options.copyProperty ? src.property : defaults.property,
            development: options.copyDevelopment
              ? src.development
              : { ...defaults.development, timeline: src.development.timeline },
            financing: options.copyFinancing ? src.financing : defaults.financing,
            revenue: options.copyRevenue ? src.revenue : defaults.revenue,
            operating: options.copyOperating ? src.operating : defaults.operating,
            jv: options.copyJV ? src.jv : defaults.jv,
            cashflow: options.copyCashflow ? src.cashflow : defaults.cashflow,
            budgetVsActual: options.copyBudget ? src.budgetVsActual : defaults.budgetVsActual,
            sda: src.sda,
            capitalStack: options.copyFinancing ? src.capitalStack : defaults.capitalStack,
            capitalSpread: options.copyCashflow ? src.capitalSpread : defaults.capitalSpread,
          };

          const copy: Scenario = {
            id: crypto.randomUUID(),
            name,
            inputs: newInputs,
            sortOrder: Math.max(...state.scenarios.map((s) => s.sortOrder), 0) + 1,
            synced: false,
            remoteId: null,
          };
          return {
            scenarios: [...state.scenarios, copy],
            activeScenarioId: copy.id,
          };
        }),

      setScenarios: (scenarios) => set({ scenarios }),

      getActiveScenario: () => {
        const state = get();
        return (
          state.scenarios.find((s) => s.id === state.activeScenarioId) ??
          state.scenarios[0] ??
          null
        );
      },

      getActiveInputs: () => {
        const scenario = get().getActiveScenario();
        return scenario?.inputs ?? null;
      },

      updateActiveInputs: (inputs) =>
        set((state) => {
          const activeId = state.activeScenarioId ?? state.scenarios[0]?.id;
          if (!activeId) return state;
          return {
            scenarios: state.scenarios.map((s) =>
              s.id === activeId
                ? { ...s, inputs: { ...s.inputs, ...inputs }, synced: false }
                : s
            ),
          };
        }),

      // Hydration
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "fease-it-storage-v2",
      partialize: (state) => ({
        projectId: state.projectId,
        projectName: state.projectName,
        scenarios: state.scenarios,
        activeScenarioId: state.activeScenarioId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Ensure activeScenarioId is valid after rehydration
        if (state && state.scenarios.length > 0 && !state.activeScenarioId) {
          state.setActiveScenario(state.scenarios[0].id);
        }
      },
    }
  )
);
