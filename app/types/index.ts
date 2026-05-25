// ============================================================
// Fease-it: Complete Type System
// Fully configurable — no hardcoded values
// ============================================================

// --- GST Configuration ---
export type GSTTreatment =
  | "gst-free"           // Existing residential subdivision, no new build
  | "margin-scheme"      // New residential: GST on (sale - purchase) × 10%
  | "full-gst"           // Commercial / ineligible for margin: GST on sale × 10%
  | "input-taxed"        // Existing residential rental
  | "going-concern";     // Sold as going concern (GST-free)

export interface GSTConfig {
  treatment: GSTTreatment;
  // For margin scheme: cost base per lot (defaults to purchasePrice / numLots)
  costBasePerLot?: number;
  // For full GST: custom GST rate (default 10%)
  gstRate?: number;
}

// --- Lot Configuration ---
export interface LotConfig {
  id: number;
  name: string;               // e.g. "Block 44", "Block 92"
  salePrice: number;
  buildAreaSqm: number;       // Construction area for this lot
  landAreaSqm: number;        // Land portion for this lot
  // For hold scenarios: whether this lot is held (not sold)
  isHeld: boolean;
  // For build scenarios: whether this lot has construction
  hasConstruction: boolean;
}

// --- Acquisition Costs (fully configurable) ---
export type GSTCostTreatment = "free" | "inclusive" | "exclusive";

export interface AcquisitionCostItem {
  id: string;
  name: string;
  amount: number;
  isPercentage: boolean;      // If true, amount is % of purchasePrice
  gstTreatment: GSTCostTreatment;
}

export interface AcquisitionInputs {
  purchasePrice: number;
  landArea: number;           // total sqm
  location: string;           // VIC, NSW, QLD, etc.
  // Structured address fields
  address: string;            // Street address
  suburb: string;
  postcode: string;
  // Configurable line items instead of hardcoded values
  costs: AcquisitionCostItem[];
  // Land tax configuration
  landTaxAuto: boolean;       // true = auto-calculate from state brackets
  landTaxOverride?: number;   // user-editable annual amount (when auto=false)
  landValue: number;          // unimproved land value for land tax calc (defaults to purchasePrice)
}

// --- Development Costs (fully configurable) ---
export interface DevelopmentCostItem {
  id: string;
  name: string;
  amount: number;
  isPercentage: boolean;      // If true, amount is % of totalRevenue
  applyPerLot: boolean;       // If true, amount × numLots
  gstTreatment: GSTCostTreatment;
}

export interface TimelineInputs {
  settlementDate: string;     // ISO date
  contractDate: string;       // ISO date
  timelineMonths: number;     // Total project duration in months
}

// --- Development Strategy ---
export type DevelopmentStrategyType =
  | "sub-division"
  | "townhouse"
  | "apartments"
  | "single-house";

export type PricingModel =
  | "average"
  | "individual"
  | "group-size"
  | "per-sqm";

export interface LotSizeGroup {
  id: string;
  name: string;
  minSqm: number;
  maxSqm: number;
  pricePerLot: number;
}

export interface DevelopmentStrategy {
  strategyType: DevelopmentStrategyType;
  pricingModel: PricingModel;
  // For stress test
  minLots: number | null;
  maxLots: number | null;
  // For average model
  averagePricePerLot: number;
  // For per-sqm model
  pricePerSqm: number;
  // For group-size model
  lotSizeGroups: LotSizeGroup[];
}

export interface DevelopmentInputs {
  numDwellings: number;
  lots: LotConfig[];          // Per-lot configuration
  // Global development costs
  globalCosts: DevelopmentCostItem[];
  // Construction cost per sqm (applied to each lot's buildArea)
  constructionCostPerSqm: number;
  // Contingency as % of total development cost
  contingencyPercent: number;
  // Project timeline
  timeline: TimelineInputs;
  // Development strategy & pricing
  strategy: DevelopmentStrategy;
  // Global GST treatment for all line items (except free items)
  gstGlobalTreatment: GSTCostTreatment;
}

// --- Financing (fully configurable) ---
export interface FinancingInputs {
  lvr: number;                // 65, 70, 80, etc. (not just 70/80)
  interestRate: number;       // annual %
  loanTermMonths: number;
  // Configurable fees
  establishmentFeePercent: number;
  brokerFeePercent: number;
  settlementFee: number;
  // Deferred / prepaid interest
  deferredFeeMonths: number;  // months of interest deferred
  // Optional second loan / mezzanine
  secondLvr?: number;
  secondInterestRate?: number;
  // Capital stack base selection
  lvrBase: "net-grv" | "net-project-costs";
  secondLvrBase?: "net-grv" | "net-project-costs";
}

// --- Capital Stack ---
export interface PrivateLendingConfig {
  amount: number;
  isPercentageOfCost: boolean;
  interestRate: number;
}

export interface ProfitSharingConfig {
  amountCommitted: number;
  percentOfTotalCapital: number;
  percentOfProfit: number;
}

export interface DeveloperEquityConfig {
  amount: number;
  isAutoComputed: boolean;
}

export interface OtherEquityConfig {
  amount: number;
  isPercentageOfCost: boolean;
}

export interface CapitalStackConfig {
  privateLending: PrivateLendingConfig;
  profitSharing: ProfitSharingConfig;
  developerEquity: DeveloperEquityConfig;
  otherEquity: OtherEquityConfig;
}

// --- Capital Spread ---
export interface CapitalSpreadItem {
  id: string;
  description: string;
  amount: number;
  isPercentage: boolean;
  date: string;
  type: "Deposit" | "Progress" | "Final";
  linkedStackCategory?: string;
}

// --- Revenue (per-lot + global) ---
export interface RevenueInputs {
  gst: GSTConfig;
  // Capital growth for hold scenarios
  capitalGrowthRate: number;
  // Rental inputs (for hold scenarios)
  rentalIncomePerUnitPerWeek: number;
  rentalGrowthRate: number;
  vacancyRate: number;
  rentalShadingPercent: number;  // % of rent counted by banks (e.g. 90%)
  numUnitsForRent: number;
  // Margin scheme override
  applyMarginScheme: boolean;
  // Sales commission
  salesCommissionType: "percentage" | "flat";
  salesCommissionPercent: number;
  salesCommissionFlat: number;
}

// --- Operating Costs (for hold/rental) ---
export interface OperatingCostItem {
  id: string;
  name: string;
  annualAmount: number;
  isPercentageOfRent: boolean;
  escalationRate: number;     // annual % increase
}

export interface OperatingInputs {
  costs: OperatingCostItem[];
  // Holding period in years (for valuation projections)
  holdPeriodYears: number;
}

// --- JV / Capital Stack ---
export interface InvestorRound {
  id: string;
  name: string;               // e.g. "Round 1", "Round 2"
  totalRaised: number;
  investors: Investor[];
  // Interest rate if structured as debt/loan
  interestRate?: number;
  // Preferred return %
  preferredReturn?: number;
}

export interface Investor {
  id: string;
  name: string;
  amount: number;
  // Equity share % of this round (if not using pro-rata)
  equitySharePercent?: number;
}

export interface JVConfig {
  // Developer equity contribution
  developerEquity: number;
  // Profit split: investor % / developer %
  investorProfitSharePercent: number;
  developerProfitSharePercent: number;
  // Capital rounds
  rounds: InvestorRound[];
  // Money partner (loan) details
  moneyPartners: MoneyPartner[];
}

export interface MoneyPartner {
  id: string;
  name: string;
  amount: number;
  interestRate: number;
  monthsLoaned: number;
}

// --- Budget vs Actual ---
export interface BudgetActualItem {
  id: string;
  category: string;
  budget: number;
  actual: number;
  // Computed
  variance: number;
  variancePercent: number;
}

export interface BudgetVsActual {
  items: BudgetActualItem[];
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
}

// --- Scenarios ---
export type ProjectScenario =
  | "sell-all"           // Sell all lots (subdivision)
  | "sell-1-hold-1"      // Sell one lot, hold one for rental
  | "rental-hold"        // Hold all for rental (no sale)
  | "land-plus-build"    // Sell 1 lot + build 1 dwelling
  | "build-hold"         // Build dwellings and hold for rent
  | "sda-hold";          // SDA disability housing (separate module)

// --- Cashflow Configuration ---
export type CashflowFrequency = "monthly" | "quarterly" | "annual";

export interface CashflowPhase {
  id: string;
  name: string;
  months: number;
  // Costs during this phase
  costs: { name: string; amount: number; frequency: "once" | "monthly" }[];
  // Income during this phase
  income: { name: string; amount: number; frequency: "once" | "monthly" }[];
}

export interface CashflowConfig {
  frequency: CashflowFrequency;
  startDate: string;          // ISO date
  phases: CashflowPhase[];
  // Manual overrides
  overrides: CashflowRow[];
}

// --- Strategies ---

export interface StrategyScenario {
  id: string;
  name: string;
  strategy: ProjectScenario;
  description: string;
  inputs: FeasibilityInputs;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  scenarios: StrategyScenario[];
}

// --- Main Input Types ---

export interface FeasibilityInputs {
  name: string;
  scenario: ProjectScenario;
  property: AcquisitionInputs;
  development: DevelopmentInputs;
  financing: FinancingInputs;
  revenue: RevenueInputs;
  operating: OperatingInputs;
  jv: JVConfig;
  cashflow: CashflowConfig;
  budgetVsActual: BudgetVsActual;
  sda: SDAUnitConfig;
  capitalStack: CapitalStackConfig;
  capitalSpread: CapitalSpreadItem[];
}

// --- Result Types ---

export interface LotResult {
  id: number;
  name: string;
  salePrice: number;
  gstPayable: number;
  netRevenue: number;
  constructionCost: number;
  isSold: boolean;
  isHeld: boolean;
}

export interface CostBreakdown {
  acquisition: number;
  stampDuty: number;
  buyersFees: number;
  legalDueDiligence: number;
  construction: number;
  development: number;
  financing: number;
  marketing: number;
  holding: number;
  landTax: number;
  contingency: number;
  salesCommission: number;
  total: number;
}

export interface JVResult {
  totalCapitalRaised: number;
  developerEquity: number;
  totalInvestment: number;
  investorProfitShare: number;
  developerProfitShare: number;
  // Per-round returns
  roundReturns: {
    roundId: string;
    roundName: string;
    investorReturn: number;
    investorReturnPercent: number;
    irr: number;
  }[];
  // Money partner interest
  moneyPartnerInterest: number;
  // Total JV cost
  totalJVCost: number;
}

export interface CashflowRow {
  period: number;             // month/quarter/year number
  periodLabel: string;        // "Jan 2026", "Q1 2026", "FY2026"
  income: number;
  expenses: number;
  netCashflow: number;
  cumulativeCashflow: number;
  // Detail
  incomeItems: { name: string; amount: number }[];
  expenseItems: { name: string; amount: number }[];
}

export interface SensitivityRow {
  label: string;
  profit: number;
  margin: number;
  cashRequired: number;
  irr?: number;
}

export interface ComparisonRow {
  lvr: number;
  loan: number;
  cashRequired: number;
  monthlyPayment: number;
  profitAfterInterest: number;
  totalInterest: number;
  profitMargin: number;
}

export interface ScenarioResult {
  scenario: ProjectScenario;
  scenarioName: string;
  totalRevenue: number;
  totalGst: number;
  totalCosts: number;
  profit: number;
  profitMargin: number;
  profitOnCost: number;       // profit / totalCost
  cashRequired: number;
  loanAmount: number;
  equityRequired: number;
  costBreakdown: CostBreakdown;
  lotResults: LotResult[];
  comparison: ComparisonRow[];
  sensitivity: SensitivityRow[];
  cashflow: CashflowRow[];
  jv: JVResult;
  irr: number;
  paybackMonths: number;
  // For hold scenarios
  annualRentalIncome: number;
  annualOperatingExpenses: number;
  netOperatingIncome: number;
  capRate: number;
  // 7-year projection
  yearlyProjections: YearlyProjection[];
  // Tax & commission
  cgtEstimate: number;
  marginSchemeGst: number;
  salesCommission: number;
  // Capital stack
  deficit: number;
  totalProjectCost: number;
  seniorDebtAmount: number;
  mezzanineDebtAmount: number;
  privateLendingAmount: number;
  developerEquityAmount: number;
  otherEquityAmount: number;
  profitSharingAmount: number;
  committedCapital: number;
}

export interface YearlyProjection {
  year: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
  rentalIncome: number;
  operatingExpenses: number;
  interestPayment: number;
  netCashflow: number;
  cumulativeCashflow: number;
  // Exit analysis
  salePrice?: number;
  sellingCosts?: number;
  loanPayable?: number;
  residue?: number;
  investorPayback?: number;
  profit?: number;
  profitPercent?: number;
}

export interface FeasibilityResults {
  activeScenario: ProjectScenario;
  scenarios: ScenarioResult[];
  // Budget vs Actual
  budgetVsActual: BudgetVsActual;
}

export interface Feasibility {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  inputs: FeasibilityInputs;
  results: FeasibilityResults;
}

// --- SDA Module Types (separate module) ---
export interface SDAUnitConfig {
  units: number;
  sdaBasicMonthly: number;
  rrcMonthly: number;
  ooaLeaseMonthly: number;
  // Scenarios
  sdaScenario: "full" | "50" | "none";  // % of SDA uptake
  // Revenue splits
  landlordSharePercent: number;  // e.g. 92%
  providerFeePercent: number;    // e.g. 16%
  // Guarantee
  landlordGuaranteedAnnual: number; // e.g. $140,000
  // Splits for excess revenue
  excessRevenueSplit: "50-50" | "75-25" | "70-30" | "60-40";
}

export interface SDAResult {
  totalWeeklyRevenue: number;
  totalAnnualRevenue: number;
  landlordShare: number;
  providerShare: number;
  // Additional computed fields
  netCashflow: number;
  netCashflowBeforeInterest: number;
  expenses: number;
  providerFee: number;
  // Per-unit breakdown
  perUnitBreakdown: {
    units: number;
    totalWithSDA: number;
    totalWithoutSDA: number;
    scenarioRevenue: number;
    landlordGuaranteed: number;
    excessRevenue: number;
    acaresShare: number;
    landlordFinal: number;
  }[];
}

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

export interface Scenario {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
  inputs: FeasibilityInputs;
  results: FeasibilityResults | null;
  created_at: string;
  updated_at: string;
}
