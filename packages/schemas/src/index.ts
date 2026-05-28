import { z } from "zod";
import { PositiveInt, Money, NetMoney, Percentage, Nat, FromStringified } from "./fundamental-types";
export * from "./fundamental-types";

// --- Enums & Literals ---
export const ProjectScenarioSchema = z.enum([
  "build-sell",
  "sell-1-hold-1",
  "rental-hold",
  "land-plus-build",
  "build-hold",
  "sda-hold",
]);
export type ProjectScenario = z.infer<typeof ProjectScenarioSchema>;

export const GSTTreatmentSchema = z.enum([
  "gst-free",
  "margin-scheme",
  "full-gst",
  "input-taxed",
  "going-concern",
]);
export type GSTTreatment = z.infer<typeof GSTTreatmentSchema>;

export const GSTCostTreatmentSchema = z.enum(["free", "inclusive", "exclusive"]);
export type GSTCostTreatment = z.infer<typeof GSTCostTreatmentSchema>;

export const GSTConfigSchema = z.object({
  treatment: GSTTreatmentSchema,
  costBasePerLot: Money.optional(),
  gstRate: Percentage.optional(),
});
export type GSTConfig = z.infer<typeof GSTConfigSchema>;

// --- Lot Configuration ---
export const LotConfigSchema = z.object({
  id: Nat,
  name: z.string(),
  salePrice: Money,
  buildAreaSqm: z.number().min(0),
  landAreaSqm: z.number().min(0),
  isHeld: z.boolean(),
  hasConstruction: z.boolean(),
});
export type LotConfig = z.infer<typeof LotConfigSchema>;

// --- Acquisition Costs ---
export const AcquisitionCostItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: Money,
  isPercentage: z.boolean(),
  gstTreatment: GSTCostTreatmentSchema,
});
export type AcquisitionCostItem = z.infer<typeof AcquisitionCostItemSchema>;

export const AcquisitionInputsSchema = z.object({
  purchasePrice: Money,
  landArea: z.number().min(0),
  location: z.string(),
  address: z.string(),
  suburb: z.string(),
  postcode: z.string(),
  costs: z.array(AcquisitionCostItemSchema),
  landTaxAuto: z.boolean().catch(true),
  landTaxOverride: Money.optional(),
  landValue: Money.catch(0 as any),
});
export type AcquisitionInputs = z.infer<typeof AcquisitionInputsSchema>;

// --- Development Costs ---
export const DevelopmentCostItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: Money,
  isPercentage: z.boolean(),
  applyPerLot: z.boolean(),
  gstTreatment: GSTCostTreatmentSchema,
});
export type DevelopmentCostItem = z.infer<typeof DevelopmentCostItemSchema>;

export const TimelineInputsSchema = z.object({
  settlementDate: z.string(),
  contractDate: z.string(),
  timelineMonths: PositiveInt,
});
export type TimelineInputs = z.infer<typeof TimelineInputsSchema>;

export const DevelopmentStrategyTypeSchema = z.enum(["sub-division", "townhouse", "apartments", "single-house"]);
export type DevelopmentStrategyType = z.infer<typeof DevelopmentStrategyTypeSchema>;

export const PricingModelSchema = z.enum(["average", "individual", "group-size", "per-sqm"]);
export type PricingModel = z.infer<typeof PricingModelSchema>;

export const LotSizeGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  minSqm: z.number().min(0),
  maxSqm: z.number().min(0),
  pricePerLot: Money,
});
export type LotSizeGroup = z.infer<typeof LotSizeGroupSchema>;

export const DevelopmentStrategySchema = z.object({
  strategyType: DevelopmentStrategyTypeSchema,
  pricingModel: PricingModelSchema,
  minLots: Nat.nullable(),
  maxLots: Nat.nullable(),
  averagePricePerLot: Money,
  averageBuildAreaPerLot: z.number().min(0).catch(0),
  pricePerSqm: Money,
  lotSizeGroups: z.array(LotSizeGroupSchema),
});
export type DevelopmentStrategy = z.infer<typeof DevelopmentStrategySchema>;

export const DevelopmentInputsSchema = z.object({
  numDwellings: PositiveInt,
  lots: z.array(LotConfigSchema),
  globalCosts: z.array(DevelopmentCostItemSchema),
  constructionCostPerSqm: Money,
  contingencyPercent: Percentage,
  timeline: TimelineInputsSchema,
  strategy: DevelopmentStrategySchema,
  gstGlobalTreatment: GSTCostTreatmentSchema,
});
export type DevelopmentInputs = z.infer<typeof DevelopmentInputsSchema>;

// --- Financing ---
export const FinancingInputsSchema = z.object({
  lvr: Percentage,
  interestRate: Percentage,
  loanTermMonths: PositiveInt,
  establishmentFeePercent: Percentage,
  brokerFeePercent: Percentage,
  settlementFee: Money,
  deferredFeeMonths: Nat,
  secondLvr: Percentage.optional(),
  secondInterestRate: Percentage.optional(),
  lvrBase: z.enum(["net-grv", "net-project-costs"]),
  secondLvrBase: z.enum(["net-grv", "net-project-costs"]).optional(),
});
export type FinancingInputs = z.infer<typeof FinancingInputsSchema>;

// --- Revenue ---
export const RevenueInputsSchema = z.object({
  gst: GSTConfigSchema,
  capitalGrowthRate: Percentage,
  rentalIncomePerUnitPerWeek: Money,
  rentalGrowthRate: Percentage,
  vacancyRate: Percentage,
  rentalShadingPercent: Percentage,
  numUnitsForRent: Nat,
  applyMarginScheme: z.boolean(),
  salesCommissionType: z.enum(["percentage", "flat"]),
  salesCommissionPercent: Percentage,
  salesCommissionFlat: Money,
});
export type RevenueInputs = z.infer<typeof RevenueInputsSchema>;

// --- Operating Costs ---
export const OperatingCostItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  annualAmount: Money,
  isPercentageOfRent: z.boolean(),
  escalationRate: Percentage,
});
export type OperatingCostItem = z.infer<typeof OperatingCostItemSchema>;

export const OperatingInputsSchema = z.object({
  costs: z.array(OperatingCostItemSchema),
  holdPeriodYears: PositiveInt,
});
export type OperatingInputs = z.infer<typeof OperatingInputsSchema>;

// --- JV / Capital Stack ---
export const InvestorSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: Money,
  equitySharePercent: Percentage.optional(),
});
export type Investor = z.infer<typeof InvestorSchema>;

export const InvestorRoundSchema = z.object({
  id: z.string(),
  name: z.string(),
  totalRaised: Money,
  investors: z.array(InvestorSchema),
  interestRate: Percentage.optional(),
  preferredReturn: Percentage.optional(),
});
export type InvestorRound = z.infer<typeof InvestorRoundSchema>;

export const MoneyPartnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: Money,
  interestRate: Percentage,
  monthsLoaned: PositiveInt,
});
export type MoneyPartner = z.infer<typeof MoneyPartnerSchema>;

export const JVConfigSchema = z.object({
  developerEquity: Money,
  investorProfitSharePercent: Percentage,
  developerProfitSharePercent: Percentage,
  rounds: z.array(InvestorRoundSchema),
  moneyPartners: z.array(MoneyPartnerSchema),
});
export type JVConfig = z.infer<typeof JVConfigSchema>;

// --- Cashflow ---
export const CashflowFrequencySchema = z.enum(["monthly", "quarterly", "annual"]);
export type CashflowFrequency = z.infer<typeof CashflowFrequencySchema>;

export const CashflowPhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  months: PositiveInt,
  costs: z.array(z.object({ name: z.string(), amount: Money, frequency: z.enum(["once", "monthly"]) })),
  income: z.array(z.object({ name: z.string(), amount: Money, frequency: z.enum(["once", "monthly"]) })),
});
export type CashflowPhase = z.infer<typeof CashflowPhaseSchema>;

export const CashflowRowSchema = z.object({
  period: Nat,
  periodLabel: z.string(),
  income: z.number(),
  expenses: z.number(),
  netCashflow: z.number(),
  cumulativeCashflow: z.number(),
  incomeItems: z.array(z.object({ name: z.string(), amount: z.number() })),
  expenseItems: z.array(z.object({ name: z.string(), amount: z.number() })),
});
export type CashflowRow = z.infer<typeof CashflowRowSchema>;

export const CashflowConfigSchema = z.object({
  frequency: CashflowFrequencySchema,
  startDate: z.string(),
  phases: z.array(CashflowPhaseSchema),
  overrides: z.array(CashflowRowSchema),
});
export type CashflowConfig = z.infer<typeof CashflowConfigSchema>;

// --- Budget vs Actual ---
export const BudgetActualItemSchema = z.object({
  id: z.string(),
  category: z.string(),
  budget: Money,
  actual: Money,
  variance: z.number(),
  variancePercent: z.number(),
});
export type BudgetActualItem = z.infer<typeof BudgetActualItemSchema>;

export const BudgetVsActualSchema = z.object({
  items: z.array(BudgetActualItemSchema),
  totalBudget: Money,
  totalActual: Money,
  totalVariance: z.number(),
});
export type BudgetVsActual = z.infer<typeof BudgetVsActualSchema>;

// --- SDA Module ---
export const SDAUnitConfigSchema = z.object({
  units: PositiveInt,
  sdaBasicMonthly: Money,
  rrcMonthly: Money,
  ooaLeaseMonthly: Money,
  sdaScenario: z.enum(["full", "50", "none"]),
  landlordSharePercent: Percentage,
  providerFeePercent: Percentage,
  landlordGuaranteedAnnual: Money,
  excessRevenueSplit: z.enum(["50-50", "75-25", "70-30", "60-40"]),
});
export type SDAUnitConfig = z.infer<typeof SDAUnitConfigSchema>;

export const SDAResultSchema = z.object({
  totalWeeklyRevenue: Money,
  totalAnnualRevenue: Money,
  landlordShare: Money,
  providerShare: Money,
  netCashflow: Money,
  netCashflowBeforeInterest: Money,
  expenses: Money,
  providerFee: Money,
  perUnitBreakdown: z.array(z.object({
    units: Nat,
    totalWithSDA: Money,
    totalWithoutSDA: Money,
    scenarioRevenue: Money,
    landlordGuaranteed: Money,
    excessRevenue: Money,
    acaresShare: Money,
    landlordFinal: Money,
  })),
});
export type SDAResult = z.infer<typeof SDAResultSchema>;

// --- Capital Stack ---
export const PrivateLendingConfigSchema = z.object({
  amount: Money,
  isPercentageOfCost: z.boolean(),
  interestRate: Percentage,
});
export type PrivateLendingConfig = z.infer<typeof PrivateLendingConfigSchema>;

export const ProfitSharingConfigSchema = z.object({
  amountCommitted: Money,
  percentOfTotalCapital: Percentage,
  percentOfProfit: Percentage,
});
export type ProfitSharingConfig = z.infer<typeof ProfitSharingConfigSchema>;

export const DeveloperEquityConfigSchema = z.object({
  amount: Money,
  isAutoComputed: z.boolean(),
});
export type DeveloperEquityConfig = z.infer<typeof DeveloperEquityConfigSchema>;

export const OtherEquityConfigSchema = z.object({
  amount: Money,
  isPercentageOfCost: z.boolean(),
});
export type OtherEquityConfig = z.infer<typeof OtherEquityConfigSchema>;

export const CapitalStackConfigSchema = z.object({
  privateLending: PrivateLendingConfigSchema,
  profitSharing: ProfitSharingConfigSchema,
  developerEquity: DeveloperEquityConfigSchema,
  otherEquity: OtherEquityConfigSchema,
});
export type CapitalStackConfig = z.infer<typeof CapitalStackConfigSchema>;

export const CapitalSpreadItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  amount: Money,
  isPercentage: z.boolean(),
  date: z.string(),
  type: z.enum(["Deposit", "Progress", "Final"]),
  linkedStackCategory: z.string().optional(),
});
export type CapitalSpreadItem = z.infer<typeof CapitalSpreadItemSchema>;

// --- Main Input Types ---
export const FeasibilityInputsSchema = z.object({
  name: z.string().min(1),
  scenario: ProjectScenarioSchema.catch("build-sell"),
  property: AcquisitionInputsSchema,
  development: DevelopmentInputsSchema,
  financing: FinancingInputsSchema,
  revenue: RevenueInputsSchema,
  operating: OperatingInputsSchema,
  jv: JVConfigSchema,
  cashflow: CashflowConfigSchema,
  budgetVsActual: BudgetVsActualSchema,
  sda: SDAUnitConfigSchema,
  capitalStack: CapitalStackConfigSchema,
  capitalSpread: z.array(CapitalSpreadItemSchema),
});
export type FeasibilityInputs = z.infer<typeof FeasibilityInputsSchema>;
export type FeasibilityFormInputs = z.input<typeof FeasibilityInputsSchema>;

export const StrategyScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  strategy: ProjectScenarioSchema,
  description: z.string(),
  inputs: FeasibilityInputsSchema,
});
export type StrategyScenario = z.infer<typeof StrategyScenarioSchema>;

export const StrategySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isBuiltIn: z.boolean(),
  scenarios: z.array(StrategyScenarioSchema),
});
export type Strategy = z.infer<typeof StrategySchema>;

// --- Result Types ---
export const LotResultSchema = z.object({
  id: Nat,
  name: z.string(),
  salePrice: Money,
  gstPayable: Money,
  netRevenue: Money,
  constructionCost: Money,
  isSold: z.boolean(),
  isHeld: z.boolean(),
});
export type LotResult = z.infer<typeof LotResultSchema>;

export const CostBreakdownSchema = z.object({
  acquisition: Money,
  stampDuty: Money,
  buyersFees: Money,
  legalDueDiligence: Money,
  construction: Money,
  development: Money,
  financing: Money,
  marketing: Money,
  holding: Money,
  landTax: Money,
  contingency: Money,
  salesCommission: Money,
  total: Money,
});
export type CostBreakdown = z.infer<typeof CostBreakdownSchema>;

export const JVResultSchema = z.object({
  totalCapitalRaised: Money,
  developerEquity: Money,
  totalInvestment: Money,
  investorProfitShare: Money,
  developerProfitShare: Money,
  roundReturns: z.array(z.object({
    roundId: z.string(),
    roundName: z.string(),
    investorReturn: Money,
    investorReturnPercent: Percentage,
    irr: z.number(),
  })),
  moneyPartnerInterest: Money,
  totalJVCost: Money,
});
export type JVResult = z.infer<typeof JVResultSchema>;

export const SensitivityRowSchema = z.object({
  label: z.string(),
  profit: z.number(),
  margin: Percentage,
  cashRequired: Money,
  irr: Percentage.optional(),
});
export type SensitivityRow = z.infer<typeof SensitivityRowSchema>;

export const ComparisonRowSchema = z.object({
  lvr: Percentage,
  loan: Money,
  cashRequired: Money,
  monthlyPayment: Money,
  profitAfterInterest: z.number(),
  totalInterest: Money,
  profitMargin: Percentage,
});
export type ComparisonRow = z.infer<typeof ComparisonRowSchema>;

export const YearlyProjectionSchema = z.object({
  year: Nat,
  propertyValue: Money,
  loanBalance: Money,
  equity: NetMoney,
  rentalIncome: Money,
  operatingExpenses: Money,
  interestPayment: Money,
  netCashflow: NetMoney,
  cumulativeCashflow: NetMoney,
  salePrice: Money.optional(),
  sellingCosts: Money.optional(),
  loanPayable: NetMoney.optional(),
  residue: NetMoney.optional(),
  investorPayback: NetMoney.optional(),
  profit: NetMoney.optional(),
  profitPercent: Percentage.optional(),
});
export type YearlyProjection = z.infer<typeof YearlyProjectionSchema>;

export const ScenarioResultSchema = z.object({
  scenario: ProjectScenarioSchema,
  scenarioName: z.string(),
  totalRevenue: Money,
  totalGst: Money,
  totalCosts: Money,
  profit: z.number(),
  profitMargin: Percentage,
  profitOnCost: Percentage,
  cashRequired: Money,
  loanAmount: Money,
  equityRequired: Money,
  costBreakdown: CostBreakdownSchema,
  lotResults: z.array(LotResultSchema),
  comparison: z.array(ComparisonRowSchema),
  sensitivity: z.array(SensitivityRowSchema),
  cashflow: z.array(CashflowRowSchema),
  jv: JVResultSchema,
  irr: Percentage,
  paybackMonths: Nat,
  annualRentalIncome: Money,
  annualOperatingExpenses: Money,
  netOperatingIncome: z.number(),
  capRate: Percentage,
  yearlyProjections: z.array(YearlyProjectionSchema),
  cgtEstimate: Money,
  marginSchemeGst: Money,
  salesCommission: Money,
  deficit: Money,
  totalProjectCost: Money,
  seniorDebtAmount: Money,
  mezzanineDebtAmount: Money,
  privateLendingAmount: Money,
  developerEquityAmount: Money,
  otherEquityAmount: Money,
  profitSharingAmount: Money,
  committedCapital: Money,
});
export type ScenarioResult = z.infer<typeof ScenarioResultSchema>;

export const FeasibilityResultsSchema = z.object({
  activeScenario: ProjectScenarioSchema,
  scenarios: z.array(ScenarioResultSchema),
  budgetVsActual: BudgetVsActualSchema,
});
export type FeasibilityResults = z.infer<typeof FeasibilityResultsSchema>;

export const FeasibilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  inputs: FeasibilityInputsSchema,
  results: FeasibilityResultsSchema,
});
export type Feasibility = z.infer<typeof FeasibilitySchema>;

export const ScenarioActionSchema = z.object({
  intent: z.enum(["create-scenario", "rename-scenario", "delete-scenario", "duplicate-scenario", "update-scenario"]),
  id: z.string().optional(),
  name: z.string().optional(),
  inputs: z.union([FromStringified.pipe(FeasibilityInputsSchema), FeasibilityInputsSchema]).optional(),
  projectId: z.string().optional(),
  localId: z.string().optional(),
  sortOrder: Nat.optional(),
});

// ============================================================
// Database Entity Types
// ============================================================

export interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DbScenario {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
  inputs: FeasibilityInputs;
  results: FeasibilityResults | null;
  created_at: string;
  updated_at: string;
}
