import { z } from "zod";

export const PositiveInt = z.number().int().positive().brand<"PositiveInt">();
export type PositiveInt = z.infer<typeof PositiveInt>;

export const NegativeInt = z.number().int().negative().brand<"NegativeInt">();
export type NegativeInt = z.infer<typeof NegativeInt>;

export const ProjectScenarioSchema = z.enum([
  "build-sell",
  "sell-1-hold-1",
  "rental-hold",
  "land-plus-build",
  "build-hold",
  "sda-hold",
]);

export const GSTTreatmentSchema = z.enum([
  "gst-free",
  "margin-scheme",
  "full-gst",
  "input-taxed",
  "going-concern",
]);

export const AcquisitionCostItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  isPercentage: z.boolean(),
  gstTreatment: z.enum(["free", "inclusive", "exclusive"]),
});

export const AcquisitionInputsSchema = z.object({
  purchasePrice: z.number(),
  landArea: z.number(),
  location: z.string(),
  address: z.string(),
  suburb: z.string(),
  postcode: z.string(),
  costs: z.array(AcquisitionCostItemSchema),
  landTaxAuto: z.boolean(),
  landTaxOverride: z.number().optional(),
  landValue: z.number(),
});

export const LotConfigSchema = z.object({
  id: z.number(),
  name: z.string(),
  salePrice: z.number().min(0),
  buildAreaSqm: z.number().min(0),
  landAreaSqm: z.number().min(0),
  isHeld: z.boolean(),
  hasConstruction: z.boolean(),
});

export const DevelopmentCostItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number().min(0),
  isPercentage: z.boolean(),
  applyPerLot: z.boolean(),
  gstTreatment: z.enum(["free", "inclusive", "exclusive"]),
});

export const TimelineInputsSchema = z.object({
  settlementDate: z.string(),
  contractDate: z.string(),
  timelineMonths: z.number().min(1).max(120),
});

export const LotSizeGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  minSqm: z.number().min(0),
  maxSqm: z.number().min(0),
  pricePerLot: z.number().min(0),
});

export const DevelopmentStrategySchema = z.object({
  strategyType: z.enum(["sub-division", "townhouse", "apartments", "single-house"]),
  pricingModel: z.enum(["average", "individual", "group-size", "per-sqm"]),
  minLots: z.number().nullable(),
  maxLots: z.number().nullable(),
  averagePricePerLot: z.number().min(0),
  averageBuildAreaPerLot: z.number().min(0),
  pricePerSqm: z.number().min(0),
  lotSizeGroups: z.array(LotSizeGroupSchema),
});

export const DevelopmentInputsSchema = z.object({
  numDwellings: PositiveInt,
  lots: z.array(LotConfigSchema),
  globalCosts: z.array(DevelopmentCostItemSchema),
  constructionCostPerSqm: z.number().min(0),
  contingencyPercent: z.number().min(0).max(100),
  timeline: TimelineInputsSchema,
  strategy: DevelopmentStrategySchema,
  gstGlobalTreatment: z.enum(["free", "inclusive", "exclusive"]),
});

export const FinancingInputsSchema = z.object({
  lvr: z.number().min(0).max(100),
  interestRate: z.number().min(0).max(50),
  loanTermMonths: PositiveInt,
  establishmentFeePercent: z.number().min(0),
  brokerFeePercent: z.number().min(0),
  settlementFee: z.number().min(0),
  deferredFeeMonths: z.number().min(0),
  secondLvr: z.number().optional(),
  secondInterestRate: z.number().optional(),
  lvrBase: z.enum(["net-grv", "net-project-costs"]),
  secondLvrBase: z.enum(["net-grv", "net-project-costs"]).optional(),
});

export const GSTConfigSchema = z.object({
  treatment: GSTTreatmentSchema,
  costBasePerLot: z.number().optional(),
  gstRate: z.number().optional(),
});

export const RevenueInputsSchema = z.object({
  gst: GSTConfigSchema,
  capitalGrowthRate: z.number(),
  rentalIncomePerUnitPerWeek: z.number().min(0),
  rentalGrowthRate: z.number(),
  vacancyRate: z.number().min(0).max(100),
  rentalShadingPercent: z.number().min(0).max(100),
  numUnitsForRent: z.number().min(0),
  applyMarginScheme: z.boolean(),
  salesCommissionType: z.enum(["percentage", "flat"]),
  salesCommissionPercent: z.number().min(0),
  salesCommissionFlat: z.number().min(0),
});

export const OperatingCostItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  annualAmount: z.number().min(0),
  isPercentageOfRent: z.boolean(),
  escalationRate: z.number(),
});

export const OperatingInputsSchema = z.object({
  costs: z.array(OperatingCostItemSchema),
  holdPeriodYears: PositiveInt,
});

export const InvestorSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number().min(0),
  equitySharePercent: z.number().optional(),
});

export const InvestorRoundSchema = z.object({
  id: z.string(),
  name: z.string(),
  totalRaised: z.number(),
  investors: z.array(InvestorSchema),
  interestRate: z.number().optional(),
  preferredReturn: z.number().optional(),
});

export const MoneyPartnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number().min(0),
  interestRate: z.number().min(0),
  monthsLoaned: PositiveInt,
});

export const JVConfigSchema = z.object({
  developerEquity: z.number().min(0),
  investorProfitSharePercent: z.number().min(0).max(100),
  developerProfitSharePercent: z.number().min(0).max(100),
  rounds: z.array(InvestorRoundSchema),
  moneyPartners: z.array(MoneyPartnerSchema),
});

export const CashflowPhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  months: PositiveInt,
  costs: z.array(z.object({ name: z.string(), amount: z.number(), frequency: z.enum(["once", "monthly"]) })),
  income: z.array(z.object({ name: z.string(), amount: z.number(), frequency: z.enum(["once", "monthly"]) })),
});

export const CashflowConfigSchema = z.object({
  frequency: z.enum(["monthly", "quarterly", "annual"]),
  startDate: z.string(),
  phases: z.array(CashflowPhaseSchema),
  overrides: z.array(z.any()),
});

export const BudgetActualItemSchema = z.object({
  id: z.string(),
  category: z.string(),
  budget: z.number(),
  actual: z.number(),
  variance: z.number(),
  variancePercent: z.number(),
});

export const BudgetVsActualSchema = z.object({
  items: z.array(BudgetActualItemSchema),
  totalBudget: z.number(),
  totalActual: z.number(),
  totalVariance: z.number(),
});

export const SDAUnitConfigSchema = z.object({
  units: PositiveInt,
  sdaBasicMonthly: z.number().min(0),
  rrcMonthly: z.number().min(0),
  ooaLeaseMonthly: z.number().min(0),
  sdaScenario: z.enum(["full", "50", "none"]),
  landlordSharePercent: z.number().min(0).max(100),
  providerFeePercent: z.number().min(0).max(100),
  landlordGuaranteedAnnual: z.number().min(0),
  excessRevenueSplit: z.enum(["50-50", "75-25", "70-30", "60-40"]),
});

export const PrivateLendingConfigSchema = z.object({
  amount: z.number().min(0),
  isPercentageOfCost: z.boolean(),
  interestRate: z.number().min(0),
});

export const ProfitSharingConfigSchema = z.object({
  amountCommitted: z.number().min(0),
  percentOfTotalCapital: z.number().min(0).max(100),
  percentOfProfit: z.number().min(0).max(100),
});

export const DeveloperEquityConfigSchema = z.object({
  amount: z.number().min(0),
  isAutoComputed: z.boolean(),
});

export const OtherEquityConfigSchema = z.object({
  amount: z.number().min(0),
  isPercentageOfCost: z.boolean(),
});

export const CapitalStackConfigSchema = z.object({
  privateLending: PrivateLendingConfigSchema,
  profitSharing: ProfitSharingConfigSchema,
  developerEquity: DeveloperEquityConfigSchema,
  otherEquity: OtherEquityConfigSchema,
});

export const CapitalSpreadItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  amount: z.number().min(0),
  isPercentage: z.boolean(),
  date: z.string(),
  type: z.enum(["Deposit", "Progress", "Final"]),
  linkedStackCategory: z.string().optional(),
});

export const FeasibilityInputsSchema = z.object({
  name: z.string().min(1),
  scenario: ProjectScenarioSchema,
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

export const ScenarioActionSchema = z.object({
  intent: z.enum(["create-scenario", "rename-scenario", "delete-scenario", "duplicate-scenario", "update-scenario"]),
  id: z.string().optional(),
  name: z.string().optional(),
  inputs: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  projectId: z.string().optional(),
  localId: z.string().optional(),
});
