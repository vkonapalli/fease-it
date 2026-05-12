import type {
  AcquisitionInputs,
  DevelopmentInputs,
  FinancingInputs,
  RevenueInputs,
  OperatingInputs,
  JVConfig,
  CostBreakdown,
  LotResult,
  JVResult,
  YearlyProjection,
  ProjectScenario,
  GSTConfig,
} from "~/types";
import { calculateGST, calculateGSTForLot } from "./gst";
import { calculateLoan } from "./financing";
import { calculateStampDuty } from "./stampDuty";

export interface ProfitBreakdown {
  totalRevenue: number;
  totalGst: number;
  totalCosts: number;
  profit: number;
  profitMargin: number;
  profitOnCost: number;
  cashRequired: number;
  loanAmount: number;
  equityRequired: number;
  costBreakdown: CostBreakdown;
  lotResults: LotResult[];
  jv: JVResult;
  yearlyProjections: YearlyProjection[];
  // Hold-specific
  annualRentalIncome?: number;
  annualOperatingExpenses?: number;
  netOperatingIncome?: number;
  capRate?: number;
}

function calculateAcquisitionCosts(property: AcquisitionInputs): {
  total: number;
  stampDuty: number;
  buyersFees: number;
  legalDueDiligence: number;
} {
  let total = property.purchasePrice;
  let buyersFees = 0;
  let legalDueDiligence = 0;

  // Stamp duty is auto-calculated based on state and purchase price.
  // Any legacy cost item named "stamp duty" is ignored.
  const stampDuty = calculateStampDuty(property.location, property.purchasePrice);
  total += stampDuty;

  for (const cost of property.costs) {
    const name = cost.name.toLowerCase();
    // Skip legacy stamp-duty line items so they aren't double-counted
    if (name.includes("stamp") || name.includes("duty")) {
      continue;
    }

    const amount = cost.isPercentage
      ? property.purchasePrice * (cost.amount / 100)
      : cost.amount;

    total += amount;

    // Categorize for breakdown
    if (name.includes("buyer") || name.includes("finder")) {
      buyersFees += amount;
    } else if (name.includes("legal") || name.includes("due") || name.includes("diligence") || name.includes("settlement")) {
      legalDueDiligence += amount;
    }
  }

  return { total, stampDuty, buyersFees, legalDueDiligence };
}

function calculateDevelopmentCosts(
  development: DevelopmentInputs,
  totalRevenue: number
): {
  total: number;
  construction: number;
  other: number;
  contingency: number;
} {
  // Construction cost = cost per sqm × build area for each lot
  let construction = 0;
  for (const lot of development.lots) {
    if (lot.hasConstruction) {
      construction += development.constructionCostPerSqm * lot.buildAreaSqm;
    }
  }

  // Global development costs
  let other = 0;
  for (const cost of development.globalCosts) {
    let amount = cost.isPercentage
      ? totalRevenue * (cost.amount / 100)
      : cost.amount;
    if (cost.applyPerLot) {
      amount *= development.numDwellings;
    }
    other += amount;
  }

  // Contingency on total development costs
  const subtotal = construction + other + development.operatingReserve;
  const contingency = subtotal * (development.contingencyPercent / 100);

  return {
    total: subtotal + contingency,
    construction,
    other,
    contingency,
  };
}

function calculateOperatingExpenses(
  operating: OperatingInputs,
  annualRentalIncome: number
): number {
  let total = 0;
  for (const cost of operating.costs) {
    if (cost.isPercentageOfRent) {
      total += annualRentalIncome * (cost.annualAmount / 100);
    } else {
      total += cost.annualAmount;
    }
  }
  return total;
}

function buildYearlyProjections(
  scenario: ProjectScenario,
  propertyValue: number,
  loanAmount: number,
  interestRate: number,
  annualRent: number,
  annualOpEx: number,
  capitalGrowthRate: number,
  holdPeriodYears: number,
  revenue: RevenueInputs,
  jv: JVConfig,
  costBreakdown: CostBreakdown
): YearlyProjection[] {
  const projections: YearlyProjection[] = [];
  let propertyVal = propertyValue;
  let cumulativeCashflow = 0;
  const annualInterest = loanAmount * (interestRate / 100);

  for (let year = 1; year <= holdPeriodYears; year++) {
    // Capital growth from year 2 onwards
    if (year > 1) {
      propertyVal = propertyVal * (1 + capitalGrowthRate);
    }

    const rentalIncome = annualRent * Math.pow(1 + revenue.rentalGrowthRate, year - 1);
    const operatingExpenses = annualOpEx; // simplified — could escalate too
    const interestPayment = annualInterest;
    const netCashflow = rentalIncome - operatingExpenses - interestPayment;
    cumulativeCashflow += netCashflow;

    // Exit analysis (sale at end of hold period)
    let salePrice: number | undefined;
    let sellingCosts: number | undefined;
    let loanPayable: number | undefined;
    let residue: number | undefined;
    let investorPayback: number | undefined;
    let profit: number | undefined;
    let profitPercent: number | undefined;

    if (year === holdPeriodYears && scenario !== "rental-hold") {
      salePrice = propertyVal;
      sellingCosts = costBreakdown.marketing + (propertyVal * 0.02); // commission
      loanPayable = -loanAmount;
      residue = salePrice - (sellingCosts ?? 0) - loanAmount + cumulativeCashflow;
      investorPayback = -jv.rounds.reduce((sum, r) => sum + r.totalRaised, 0) - jv.developerEquity;
      profit = residue + (investorPayback ?? 0);
      profitPercent = costBreakdown.total > 0 ? (profit / costBreakdown.total) * 100 : 0;
    }

    projections.push({
      year,
      propertyValue: propertyVal,
      loanBalance: loanAmount,
      equity: propertyVal - loanAmount,
      rentalIncome,
      operatingExpenses,
      interestPayment,
      netCashflow,
      cumulativeCashflow,
      salePrice,
      sellingCosts,
      loanPayable,
      residue,
      investorPayback,
      profit,
      profitPercent,
    });
  }

  return projections;
}

export function calculateProfit({
  scenario,
  property,
  development,
  financing,
  revenue,
  operating,
  jv,
}: {
  scenario: ProjectScenario;
  property: AcquisitionInputs;
  development: DevelopmentInputs;
  financing: FinancingInputs;
  revenue: RevenueInputs;
  operating: OperatingInputs;
  jv: JVConfig;
}): ProfitBreakdown {
  const acquisition = calculateAcquisitionCosts(property);
  const propertyValue = property.purchasePrice;

  // --- Lot-level calculations ---
  const lotResults: LotResult[] = development.lots.map((lot) => {
    const gst = calculateGSTForLot(
      lot.salePrice,
      revenue.gst.costBasePerLot ?? property.purchasePrice / development.numDwellings,
      revenue.gst.treatment
    );

    const constructionCost = lot.hasConstruction
      ? development.constructionCostPerSqm * lot.buildAreaSqm
      : 0;

    // For sell-1-hold-1 and rental scenarios
    const isSold =
      scenario === "sell-all" ||
      scenario === "land-plus-build" ||
      (scenario === "sell-1-hold-1" && !lot.isHeld);

    return {
      id: lot.id,
      name: lot.name,
      salePrice: lot.salePrice,
      gstPayable: gst,
      netRevenue: isSold ? lot.salePrice - gst : 0,
      constructionCost,
      isSold,
      isHeld: lot.isHeld,
    };
  });

  // --- Revenue ---
  const totalRevenue = lotResults.reduce((sum, lot) => sum + lot.salePrice, 0);
  const totalGst = lotResults.reduce((sum, lot) => sum + lot.gstPayable, 0);
  const netRevenue = lotResults.reduce((sum, lot) => sum + lot.netRevenue, 0);

  // --- Development Costs ---
  const devCosts = calculateDevelopmentCosts(development, totalRevenue);

  // --- Financing ---
  const loanCalc = calculateLoan({
    propertyValue,
    financing,
    totalCosts: acquisition.total + devCosts.total,
  });

  // --- Marketing ---
  // Marketing is typically a % of revenue + fixed costs
  const marketingCost =
    devCosts.other; // marketing is included in globalCosts

  // --- Holding costs ---
  const holdingCost =
    development.globalCosts
      .filter((c) => c.name.toLowerCase().includes("holding"))
      .reduce((sum, c) => {
        const amt = c.isPercentage ? totalRevenue * (c.amount / 100) : c.amount;
        return sum + (c.applyPerLot ? amt * development.numDwellings : amt);
      }, 0);

  // --- Total Costs ---
  const costBreakdown: CostBreakdown = {
    acquisition: acquisition.total,
    stampDuty: acquisition.stampDuty,
    buyersFees: acquisition.buyersFees,
    legalDueDiligence: acquisition.legalDueDiligence,
    construction: devCosts.construction,
    development: devCosts.other,
    operatingReserve: development.operatingReserve,
    financing: loanCalc.totalFees + loanCalc.totalInterestOverTerm,
    marketing: marketingCost,
    holding: holdingCost,
    contingency: devCosts.contingency,
    total: 0,
  };

  costBreakdown.total =
    costBreakdown.acquisition +
    costBreakdown.construction +
    costBreakdown.development +
    costBreakdown.operatingReserve +
    costBreakdown.financing +
    costBreakdown.marketing +
    costBreakdown.holding +
    costBreakdown.contingency;

  // --- Profit ---
  const profit = netRevenue - costBreakdown.total;
  const profitMargin = costBreakdown.total > 0 ? (profit / costBreakdown.total) * 100 : 0;
  const profitOnCost = costBreakdown.total > 0 ? (profit / costBreakdown.total) * 100 : 0;

  // --- JV Calculations ---
  const totalCapitalRaised = jv.rounds.reduce((sum, r) => sum + r.totalRaised, 0);
  const totalInvestment = totalCapitalRaised + jv.developerEquity;

  const investorProfitShare =
    profit > 0 ? profit * (jv.investorProfitSharePercent / 100) : 0;
  const developerProfitShare =
    profit > 0 ? profit * (jv.developerProfitSharePercent / 100) : 0;

  const moneyPartnerInterest = jv.moneyPartners.reduce(
    (sum, mp) =>
      sum + mp.amount * (mp.interestRate / 100) * (mp.monthsLoaned / 12),
    0
  );

  const roundReturns = jv.rounds.map((round) => {
    const investorReturn =
      profit > 0
        ? investorProfitShare * (round.totalRaised / totalCapitalRaised)
        : 0;
    const investorReturnPercent =
      round.totalRaised > 0 ? (investorReturn / round.totalRaised) * 100 : 0;
    // Simple IRR approximation
    const irr =
      round.totalRaised > 0
        ? Math.pow(1 + investorReturnPercent / 100, 1 / (financing.loanTermMonths / 12)) - 1
        : 0;

    return {
      roundId: round.id,
      roundName: round.name,
      investorReturn,
      investorReturnPercent,
      irr,
    };
  });

  const jvResult: JVResult = {
    totalCapitalRaised,
    developerEquity: jv.developerEquity,
    totalInvestment,
    investorProfitShare,
    developerProfitShare,
    roundReturns,
    moneyPartnerInterest,
    totalJVCost: totalCapitalRaised + moneyPartnerInterest,
  };

  // --- Rental / Hold calculations ---
  let annualRentalIncome: number | undefined;
  let annualOperatingExpenses: number | undefined;
  let netOperatingIncome: number | undefined;
  let capRate: number | undefined;

  const heldLots = lotResults.filter((l) => l.isHeld);
  if (heldLots.length > 0 || scenario === "rental-hold" || scenario === "build-hold") {
    const weeksPerYear = 52;
    const grossAnnualRent =
      revenue.rentalIncomePerUnitPerWeek * revenue.numUnitsForRent * weeksPerYear;
    annualRentalIncome = grossAnnualRent * (1 - revenue.vacancyRate);
    annualOperatingExpenses = calculateOperatingExpenses(operating, annualRentalIncome);
    netOperatingIncome = annualRentalIncome - annualOperatingExpenses;
    capRate = propertyValue > 0 ? (netOperatingIncome / propertyValue) * 100 : 0;
  }

  // --- Yearly Projections ---
  const yearlyProjections = buildYearlyProjections(
    scenario,
    propertyValue,
    loanCalc.loanAmount,
    financing.interestRate,
    annualRentalIncome ?? 0,
    annualOperatingExpenses ?? 0,
    revenue.capitalGrowthRate,
    operating.holdPeriodYears,
    revenue,
    jv,
    costBreakdown
  );

  return {
    totalRevenue: netRevenue,
    totalGst,
    totalCosts: costBreakdown.total,
    profit,
    profitMargin,
    profitOnCost,
    cashRequired: loanCalc.cashRequired,
    loanAmount: loanCalc.loanAmount,
    equityRequired: propertyValue - loanCalc.loanAmount,
    costBreakdown,
    lotResults,
    jv: jvResult,
    yearlyProjections,
    annualRentalIncome,
    annualOperatingExpenses,
    netOperatingIncome,
    capRate,
  };
}
