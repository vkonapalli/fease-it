// ============================================================
// SDA (Specialist Disability Accommodation) Module
// Based on NDIS SDA funding model
// ============================================================

import type {
  SDAUnitConfig,
  SDAResult,
  FeasibilityInputs,
  ProjectScenario,
} from "@fease-it/schemas";
import { SDAResultSchema } from "@fease-it/schemas";

export interface SDACalculationInputs {
  units: number;
  sdaBasicMonthly: number;
  rrcMonthly: number;
  ooaLeaseMonthly: number;
  sdaScenario: "full" | "50" | "none";
  landlordSharePercent: number;
  providerFeePercent: number;
  landlordGuaranteedAnnual: number;
  excessRevenueSplit: "50-50" | "75-25" | "70-30" | "60-40";
  // Expenses
  maintenancePercent: number;
  ratesAnnual: number;
  insuranceAnnual: number;
  propertyManagementPercent: number;
  // Financing
  interestAnnual: number;
}

function calculateSDARevenue(
  config: SDACalculationInputs
): {
  totalMonthly: number;
  totalAnnual: number;
  perUnitMonthly: number;
} {
  const { units, sdaBasicMonthly, rrcMonthly, ooaLeaseMonthly, sdaScenario } = config;

  const sdaPlusRrc = sdaBasicMonthly + rrcMonthly;

  let perUnitMonthly: number;
  switch (sdaScenario) {
    case "full":
      perUnitMonthly = sdaPlusRrc + ooaLeaseMonthly;
      break;
    case "50":
      perUnitMonthly = sdaPlusRrc * 0.5 + ooaLeaseMonthly;
      break;
    case "none":
    default:
      perUnitMonthly = ooaLeaseMonthly;
      break;
  }

  const totalMonthly = perUnitMonthly * units;
  const totalAnnual = totalMonthly * 12;

  return { totalMonthly, totalAnnual, perUnitMonthly };
}

function calculateExpenses(
  config: SDACalculationInputs,
  totalAnnualRevenue: number
): {
  maintenance: number;
  rates: number;
  insurance: number;
  propertyManagement: number;
  totalAnnual: number;
} {
  const maintenance = totalAnnualRevenue * (config.maintenancePercent / 100);
  const propertyManagement = totalAnnualRevenue * (config.propertyManagementPercent / 100);

  return {
    maintenance,
    rates: config.ratesAnnual,
    insurance: config.insuranceAnnual,
    propertyManagement,
    totalAnnual: maintenance + config.ratesAnnual + config.insuranceAnnual + propertyManagement,
  };
}

function calculateRevenueSplit(
  config: SDACalculationInputs,
  totalAnnualRevenue: number
): {
  landlordGuaranteed: number;
  excessRevenue: number;
  providerShare: number;
  landlordShare: number;
  providerFee: number;
} {
  const { landlordGuaranteedAnnual, excessRevenueSplit, providerFeePercent } = config;

  // Provider fee is taken off the top
  const providerFee = totalAnnualRevenue * (providerFeePercent / 100);
  const netRevenue = totalAnnualRevenue - providerFee;

  // Landlord gets guaranteed minimum or their share, whichever is higher
  const landlordBaseShare = netRevenue * (config.landlordSharePercent / 100);
  const landlordGuaranteed = Math.max(landlordGuaranteedAnnual, landlordBaseShare);

  // Excess revenue (above guarantee) is split
  const excessRevenue = Math.max(0, netRevenue - landlordGuaranteed);

  let providerSplitRatio: number;
  switch (excessRevenueSplit) {
    case "50-50":
      providerSplitRatio = 0.5;
      break;
    case "75-25":
      providerSplitRatio = 0.25;
      break;
    case "70-30":
      providerSplitRatio = 0.3;
      break;
    case "60-40":
      providerSplitRatio = 0.4;
      break;
    default:
      providerSplitRatio = 0.5;
  }

  const providerShare = providerFee + excessRevenue * providerSplitRatio;
  const landlordShare = landlordGuaranteed + excessRevenue * (1 - providerSplitRatio);

  return {
    landlordGuaranteed,
    excessRevenue,
    providerShare,
    landlordShare,
    providerFee,
  };
}

export function calculateSDA(config: SDACalculationInputs): SDAResult {
  const { units } = config;

  const revenue = calculateSDARevenue(config);
  const expenses = calculateExpenses(config, revenue.totalAnnual);
  const split = calculateRevenueSplit(config, revenue.totalAnnual);

  // Full SDA scenario (for comparison)
  const fullSdaRevenue = calculateSDARevenue({ ...config, sdaScenario: "full" });
  const noSdaRevenue = calculateSDARevenue({ ...config, sdaScenario: "none" });
  const fiftySdaRevenue = calculateSDARevenue({ ...config, sdaScenario: "50" });

  // Build per-unit breakdown (1-10 units for the table)
  const perUnitBreakdown = Array.from({ length: 10 }, (_, i) => {
    const unitCount = i + 1;

    const fullSda = calculateSDARevenue({ ...config, units: unitCount, sdaScenario: "full" });
    const noSda = calculateSDARevenue({ ...config, units: unitCount, sdaScenario: "none" });
    const fiftySda = calculateSDARevenue({ ...config, units: unitCount, sdaScenario: "50" });

    const activeRevenue = calculateSDARevenue({ ...config, units: unitCount });
    const activeSplit = calculateRevenueSplit(config, activeRevenue.totalAnnual);

    return {
      units: unitCount,
      totalWithSDA: fullSda.totalAnnual,
      totalWithoutSDA: noSda.totalAnnual,
      scenarioRevenue: activeRevenue.totalAnnual,
      landlordGuaranteed: activeSplit.landlordGuaranteed,
      excessRevenue: activeSplit.excessRevenue,
      acaresShare: activeSplit.providerShare,
      landlordFinal: activeSplit.landlordShare,
    };
  });

  // Net cashflow after expenses and interest
  const netCashflowBeforeInterest = split.landlordShare - expenses.totalAnnual;
  const netCashflow = netCashflowBeforeInterest - config.interestAnnual;

  return SDAResultSchema.parse({
    totalWeeklyRevenue: revenue.perUnitMonthly / 4.33, // approximate weeks
    totalAnnualRevenue: revenue.totalAnnual,
    landlordShare: split.landlordShare,
    providerShare: split.providerShare,
    perUnitBreakdown,
    // Additional computed fields
    netCashflow,
    netCashflowBeforeInterest,
    expenses: expenses.totalAnnual,
    providerFee: split.providerFee,
  });
}

// Helper to convert FeasibilityInputs to SDA inputs
export function getDefaultSDAInputs(): SDACalculationInputs {
  return {
    units: 4,
    sdaBasicMonthly: 12180,
    rrcMonthly: 11858,
    ooaLeaseMonthly: 25622,
    sdaScenario: "full",
    landlordSharePercent: 92,
    providerFeePercent: 16,
    landlordGuaranteedAnnual: 140000,
    excessRevenueSplit: "50-50",
    maintenancePercent: 15,
    ratesAnnual: 12700,
    insuranceAnnual: 12000,
    propertyManagementPercent: 8,
    interestAnnual: 118000,
  };
}
