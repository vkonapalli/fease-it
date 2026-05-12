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
export interface AcquisitionCostItem {
  id: string;
  name: string;
  amount: number;
  isPercentage: boolean;      // If true, amount is % of purchasePrice
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
}

// --- Development Costs (fully configurable) ---
export interface DevelopmentCostItem {
  id: string;
  name: string;
  amount: number;
  isPercentage: boolean;      // If true, amount is % of totalRevenue
  applyPerLot: boolean;       // If true, amount × numLots
}

export interface TimelineInputs {
  settlementDate: string;     // ISO date
  contractDate: string;       // ISO date
  timelineMonths: number;     // Total project duration in months
}

export interface DevelopmentInputs {
  numDwellings: number;
  lots: LotConfig[];          // Per-lot configuration
  // Global development costs
  globalCosts: DevelopmentCostItem[];
  // Construction cost per sqm (applied to each lot's buildArea)
  constructionCostPerSqm: number;
  // Operating reserve / repairs buffer
  operatingReserve: number;
  // Contingency as % of total development cost
  contingencyPercent: number;
  // Project timeline
  timeline: TimelineInputs;
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
  operatingReserve: number;
  financing: number;
  marketing: number;
  holding: number;
  contingency: number;
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
  sdaBasicWeekly: number;
  rrcWeekly: number;
  ooaLeaseWeekly: number;
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
