import type {
  FeasibilityInputs,
  FeasibilityResults,
  ScenarioResult,
  ProjectScenario,
  ComparisonRow,
  SensitivityRow,
  CashflowRow,
  CashflowConfig,
} from "@fease-it/schemas";
import {
  ScenarioResultSchema,
  SensitivityRowSchema,
  FeasibilityInputsSchema,
  CashflowRowSchema,
} from "@fease-it/schemas";
import { calculateProfit } from "./profit";
import { calculateLoan } from "./financing";
import { calculateLandTax } from "~/lib/constants/landTax";

const SCENARIOS: ProjectScenario[] = [
  "build-sell",
  "sell-1-hold-1",
  "rental-hold",
  "land-plus-build",
  "build-hold",
  "sda-hold",
];

function getScenarioName(scenario: ProjectScenario): string {
  const names: Record<ProjectScenario, string> = {
    "build-sell": "Build & Sell",
    "sell-1-hold-1": "Sell 1, Hold 1",
    "rental-hold": "Rental Hold",
    "land-plus-build": "Land + Build",
    "build-hold": "Build & Hold",
    "sda-hold": "SDA Hold",
  };
  return names[scenario];
}

export function calculateScenario(
  inputs: FeasibilityInputs,
  scenario: ProjectScenario
): ScenarioResult {
  const profitResult = calculateProfit({
    scenario,
    property: inputs.property,
    development: inputs.development,
    financing: inputs.financing,
    revenue: inputs.revenue,
    operating: inputs.operating,
    jv: inputs.jv,
    capitalStack: inputs.capitalStack,
  });

  // LVR Comparison
  const lvrOptions = [65, 70, 75, 80];
  const comparison: ComparisonRow[] = lvrOptions.map((lvrOption) => {
    const calc = calculateLoan({
      propertyValue: inputs.property.purchasePrice,
      financing: { ...inputs.financing, lvr: lvrOption as any },
      totalCosts: profitResult.totalCosts,
      netGrv: profitResult.totalRevenue,
      netProjectCosts: profitResult.totalCosts,
    });

    const profitAfterInterest =
      profitResult.totalRevenue -
      profitResult.totalCosts +
      (profitResult.loanAmount - calc.loanAmount);

    return {
      lvr: lvrOption as any,
      loan: calc.loanAmount as any,
      cashRequired: calc.cashRequired as any,
      monthlyPayment: calc.monthlyPayment as any,
      profitAfterInterest: profitAfterInterest > 0 ? profitAfterInterest : 0,
      totalInterest: calc.totalInterestOverTerm as any,
      profitMargin: profitResult.profitMargin as any,
    } as ComparisonRow;
  });

  // Sensitivity Analysis
  const sensitivity = calculateScenarioSensitivity(inputs, scenario);

  // Cashflow
  const cashflow = generateCashflow(
    inputs.cashflow,
    profitResult,
    inputs.financing.interestRate,
    inputs.development.timeline.settlementDate || inputs.cashflow.startDate,
    inputs.development.timeline.contractDate,
    inputs.development.timeline.timelineMonths,
    inputs.property.location,
    inputs.property.landValue || inputs.property.purchasePrice,
    inputs.property.landTaxAuto,
    inputs.property.landTaxOverride
  );

  return ScenarioResultSchema.parse({
    scenario,
    scenarioName: getScenarioName(scenario),
    totalRevenue: profitResult.totalRevenue,
    totalGst: profitResult.totalGst,
    totalCosts: profitResult.totalCosts,
    profit: profitResult.profit,
    profitMargin: profitResult.profitMargin,
    profitOnCost: profitResult.profitOnCost,
    cashRequired: profitResult.cashRequired,
    loanAmount: profitResult.loanAmount,
    equityRequired: profitResult.equityRequired,
    costBreakdown: profitResult.costBreakdown,
    lotResults: profitResult.lotResults,
    comparison,
    sensitivity,
    cashflow,
    jv: profitResult.jv,
    irr: profitResult.yearlyProjections.length > 0
      ? profitResult.yearlyProjections[profitResult.yearlyProjections.length - 1].profitPercent ?? 0
      : 0,
    paybackMonths: inputs.financing.loanTermMonths,
    annualRentalIncome: profitResult.annualRentalIncome ?? 0,
    annualOperatingExpenses: profitResult.annualOperatingExpenses ?? 0,
    netOperatingIncome: profitResult.netOperatingIncome ?? 0,
    capRate: profitResult.capRate ?? 0,
    yearlyProjections: profitResult.yearlyProjections,
    cgtEstimate: profitResult.cgtEstimate,
    marginSchemeGst: profitResult.marginSchemeGst,
    salesCommission: profitResult.salesCommission,
    deficit: profitResult.deficit,
    totalProjectCost: profitResult.totalProjectCost,
    seniorDebtAmount: profitResult.seniorDebtAmount,
    mezzanineDebtAmount: profitResult.mezzanineDebtAmount,
    privateLendingAmount: profitResult.privateLendingAmount,
    developerEquityAmount: profitResult.developerEquityAmount,
    otherEquityAmount: profitResult.otherEquityAmount,
    profitSharingAmount: profitResult.profitSharingAmount,
    committedCapital: profitResult.committedCapital,
  });
}

function buildSensitivityRow(
  inputs: FeasibilityInputs,
  scenario: ProjectScenario,
  label: string
): SensitivityRow {
  const profitResult = calculateProfit({
    scenario,
    property: inputs.property,
    development: inputs.development,
    financing: inputs.financing,
    revenue: inputs.revenue,
    operating: inputs.operating,
    jv: inputs.jv,
    capitalStack: inputs.capitalStack,
  });

  const loanCalc = calculateLoan({
    propertyValue: inputs.property.purchasePrice,
    financing: inputs.financing,
    totalCosts: profitResult.totalCosts,
    netGrv: profitResult.totalRevenue,
    netProjectCosts: profitResult.totalCosts,
  });

  const irr =
    profitResult.yearlyProjections.length > 0
      ? profitResult.yearlyProjections[profitResult.yearlyProjections.length - 1].profitPercent ?? 0
      : 0;

  return SensitivityRowSchema.parse({
    label,
    profit: profitResult.profit,
    margin: profitResult.profitMargin,
    cashRequired: loanCalc.cashRequired,
    irr,
  });
}

function calculateScenarioSensitivity(
  inputs: FeasibilityInputs,
  scenario: ProjectScenario
): SensitivityRow[] {
  const variations: { name: string; modifier: (i: FeasibilityInputs) => FeasibilityInputs }[] = [
    {
      name: "Sale Price -20%",
      modifier: (i) => ({
        ...i,
        development: {
          ...i.development,
          lots: i.development.lots.map((l) => ({ ...l, salePrice: l.salePrice * 0.8 as any })),
        },
      }),
    },
    {
      name: "Sale Price -10%",
      modifier: (i) => ({
        ...i,
        development: {
          ...i.development,
          lots: i.development.lots.map((l) => ({ ...l, salePrice: l.salePrice * 0.9 as any })),
        },
      }),
    },
    {
      name: "Sale Price +10%",
      modifier: (i) => ({
        ...i,
        development: {
          ...i.development,
          lots: i.development.lots.map((l) => ({ ...l, salePrice: l.salePrice * 1.1 as any })),
        },
      }),
    },
    {
      name: "Sale Price +20%",
      modifier: (i) => ({
        ...i,
        development: {
          ...i.development,
          lots: i.development.lots.map((l) => ({ ...l, salePrice: l.salePrice * 1.2 as any })),
        },
      }),
    },
    {
      name: "Construction Cost -20%",
      modifier: (i) => ({
        ...i,
        development: {
          ...i.development,
          constructionCostPerSqm: i.development.constructionCostPerSqm * 0.8 as any,
        },
      }),
    },
    {
      name: "Construction Cost +20%",
      modifier: (i) => ({
        ...i,
        development: {
          ...i.development,
          constructionCostPerSqm: i.development.constructionCostPerSqm * 1.2 as any,
        },
      }),
    },
    {
      name: "Interest Rate +2%",
      modifier: (i) => ({
        ...i,
        financing: { ...i.financing, interestRate: i.financing.interestRate + 2 as any },
      }),
    },
    {
      name: "Purchase Price +10%",
      modifier: (i) => ({
        ...i,
        property: { ...i.property, purchasePrice: i.property.purchasePrice * 1.1 as any },
      }),
    },
  ];

  const results: SensitivityRow[] = [];

  // Base case first
  results.push(buildSensitivityRow(inputs, scenario, "Base Case"));

  for (const v of variations) {
    results.push(buildSensitivityRow(v.modifier(inputs), scenario, v.name));
  }

  return results;
}

function generateCashflow(
  config: CashflowConfig,
  profitResult: ReturnType<typeof calculateProfit>,
  interestRate: number,
  settlementDate: string,
  contractDate: string,
  timelineMonths: number,
  location: string,
  landValue: number,
  landTaxAuto: boolean,
  landTaxOverride?: number
): CashflowRow[] {
  const rows: CashflowRow[] = [];
  let cumulative = 0;
  let periodNumber = 0;

  const start = new Date(config.startDate);

  for (const phase of config.phases) {
    for (let m = 0; m < phase.months; m++) {
      periodNumber++;
      const periodDate = new Date(start);
      periodDate.setMonth(periodDate.getMonth() + periodNumber - 1);

      const periodLabel = config.frequency === "monthly"
        ? periodDate.toLocaleDateString("en-AU", { month: "short", year: "numeric" })
        : `Period ${periodNumber}`;

      const incomeItems: { name: string; amount: number }[] = [];
      const expenseItems: { name: string; amount: number }[] = [];

      let income = 0;
      let expenses = 0;

      for (const item of phase.income) {
        const amt = item.frequency === "monthly" ? item.amount : m === 0 ? item.amount : 0;
        if (amt > 0) {
          income += amt;
          incomeItems.push({ name: item.name, amount: amt });
        }
      }

      for (const item of phase.costs) {
        const amt = item.frequency === "monthly" ? item.amount : m === 0 ? item.amount : 0;
        if (amt > 0) {
          expenses += amt;
          expenseItems.push({ name: item.name, amount: amt });
        }
      }

      // Add interest payment
      const interest = profitResult.loanAmount > 0
        ? (profitResult.loanAmount * (interestRate / 100)) / 12
        : 0;
      if (interest > 0) {
        expenses += interest;
        expenseItems.push({ name: "Interest Payment", amount: interest });
      }

      // Add land tax for December months within ownership window
      if (settlementDate && timelineMonths > 0) {
        const settlement = new Date(settlementDate);
        // Project end date is measured from contractDate, not settlementDate
        const anchor = contractDate ? new Date(contractDate) : settlement;
        const end = new Date(anchor);
        end.setMonth(end.getMonth() + timelineMonths);

        if (periodDate.getMonth() === 11) { // December
          const decYear = periodDate.getFullYear();
          const dec31 = new Date(decYear, 11, 31);
          if (dec31 >= settlement && dec31 <= end) {
            const annualLandTax = landTaxAuto
              ? calculateLandTax(location, landValue || 0, false)
              : (landTaxOverride ?? 0);
            if (annualLandTax > 0) {
              expenses += annualLandTax;
              expenseItems.push({ name: `Land Tax ${decYear}`, amount: annualLandTax });
            }
          }
        }
      }

      const net = income - expenses;
      cumulative += net;

      rows.push(CashflowRowSchema.parse({
        period: periodNumber,
        periodLabel,
        income,
        expenses,
        netCashflow: net,
        cumulativeCashflow: cumulative,
        incomeItems,
        expenseItems,
      }));
    }
  }

  return rows;
}

export function calculateFeasibility(inputs: FeasibilityInputs): FeasibilityResults {
  // Calculate all scenarios
  const scenarios = SCENARIOS.map((s) => calculateScenario(inputs, s));

  // Find the active scenario result
  const activeScenario = scenarios.find((s) => s.scenario === inputs.scenario) ?? scenarios[0];

  return {
    activeScenario: activeScenario.scenario,
    scenarios,
    budgetVsActual: inputs.budgetVsActual,
  };
}
