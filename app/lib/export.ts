import type { FeasibilityResults, ScenarioResult, CashflowRow, YearlyProjection } from "~/types";

function escapeCSV(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCSV(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(escapeCSV).join(",")).join("\n");
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportScenarioToCSV(scenario: ScenarioResult, projectName: string) {
  const timestamp = new Date().toISOString().split("T")[0];
  const prefix = `${projectName}-${scenario.scenario}-${timestamp}`;

  // 1. Summary
  const summaryRows = [
    ["Metric", "Value"],
    ["Scenario", scenario.scenarioName],
    ["Total Revenue", scenario.totalRevenue],
    ["Total GST", scenario.totalGst],
    ["Total Costs", scenario.totalCosts],
    ["Profit", scenario.profit],
    ["Profit Margin (%)", scenario.profitMargin],
    ["Profit on Cost (%)", scenario.profitOnCost],
    ["Cash Required", scenario.cashRequired],
    ["Loan Amount", scenario.loanAmount],
    ["Equity Required", scenario.equityRequired],
    ["IRR (%)", scenario.irr],
    ["Payback (months)", scenario.paybackMonths],
  ];

  if (scenario.annualRentalIncome > 0) {
    summaryRows.push(
      ["Annual Rental Income", scenario.annualRentalIncome],
      ["Annual Operating Expenses", scenario.annualOperatingExpenses],
      ["Net Operating Income", scenario.netOperatingIncome],
      ["Cap Rate (%)", scenario.capRate]
    );
  }

  downloadCSV(`${prefix}-summary.csv`, rowsToCSV(summaryRows));

  // 2. Cost Breakdown
  const costRows = [
    ["Category", "Amount"],
    ["Acquisition", scenario.costBreakdown.acquisition],
    ["Stamp Duty", scenario.costBreakdown.stampDuty],
    ["Buyers Fees", scenario.costBreakdown.buyersFees],
    ["Legal & Due Diligence", scenario.costBreakdown.legalDueDiligence],
    ["Construction", scenario.costBreakdown.construction],
    ["Development", scenario.costBreakdown.development],
    ["Operating Reserve", scenario.costBreakdown.operatingReserve],
    ["Financing", scenario.costBreakdown.financing],
    ["Marketing", scenario.costBreakdown.marketing],
    ["Holding", scenario.costBreakdown.holding],
    ["Contingency", scenario.costBreakdown.contingency],
    ["Total", scenario.costBreakdown.total],
  ];
  downloadCSV(`${prefix}-costs.csv`, rowsToCSV(costRows));

  // 3. Lot Breakdown
  const lotRows = [
    ["Lot", "Name", "Sale Price", "GST Payable", "Net Revenue", "Construction Cost", "Sold", "Held"],
    ...scenario.lotResults.map((lot) => [
      lot.id,
      lot.name,
      lot.salePrice,
      lot.gstPayable,
      lot.netRevenue,
      lot.constructionCost,
      lot.isSold ? "Yes" : "No",
      lot.isHeld ? "Yes" : "No",
    ]),
  ];
  downloadCSV(`${prefix}-lots.csv`, rowsToCSV(lotRows));

  // 4. LVR Comparison
  const comparisonRows = [
    ["LVR (%)", "Loan", "Cash Required", "Monthly Payment", "Total Interest", "Profit After Interest", "Profit Margin (%)"],
    ...scenario.comparison.map((c) => [
      c.lvr,
      c.loan,
      c.cashRequired,
      c.monthlyPayment,
      c.totalInterest,
      c.profitAfterInterest,
      c.profitMargin,
    ]),
  ];
  downloadCSV(`${prefix}-lvr-comparison.csv`, rowsToCSV(comparisonRows));

  // 5. Sensitivity
  const sensitivityRows = [
    ["Scenario", "Profit", "Margin (%)", "Cash Required", "IRR (%)"],
    ...scenario.sensitivity.map((s) => [
      s.label,
      s.profit,
      s.margin,
      s.cashRequired,
      s.irr ?? "",
    ]),
  ];
  downloadCSV(`${prefix}-sensitivity.csv`, rowsToCSV(sensitivityRows));

  // 6. Cashflow
  if (scenario.cashflow.length > 0) {
    const cashflowRows = [
      ["Period", "Label", "Income", "Expenses", "Net Cashflow", "Cumulative Cashflow"],
      ...scenario.cashflow.map((cf) => [
        cf.period,
        cf.periodLabel,
        cf.income,
        cf.expenses,
        cf.netCashflow,
        cf.cumulativeCashflow,
      ]),
    ];
    downloadCSV(`${prefix}-cashflow.csv`, rowsToCSV(cashflowRows));
  }

  // 7. Yearly Projections
  if (scenario.yearlyProjections.length > 0) {
    const projectionRows = [
      [
        "Year",
        "Property Value",
        "Loan Balance",
        "Equity",
        "Rental Income",
        "Operating Expenses",
        "Interest Payment",
        "Net Cashflow",
        "Cumulative Cashflow",
        "Sale Price",
        "Profit",
        "Profit (%)",
      ],
      ...scenario.yearlyProjections.map((p) => [
        p.year,
        p.propertyValue,
        p.loanBalance,
        p.equity,
        p.rentalIncome,
        p.operatingExpenses,
        p.interestPayment,
        p.netCashflow,
        p.cumulativeCashflow,
        p.salePrice ?? "",
        p.profit ?? "",
        p.profitPercent ?? "",
      ]),
    ];
    downloadCSV(`${prefix}-projections.csv`, rowsToCSV(projectionRows));
  }

  // 8. JV / Capital Stack
  const jv = scenario.jv;
  const jvRows = [
    ["Metric", "Value"],
    ["Total Capital Raised", jv.totalCapitalRaised],
    ["Developer Equity", jv.developerEquity],
    ["Total Investment", jv.totalInvestment],
    ["Investor Profit Share", jv.investorProfitShare],
    ["Developer Profit Share", jv.developerProfitShare],
    ["Money Partner Interest", jv.moneyPartnerInterest],
    ["Total JV Cost", jv.totalJVCost],
    ["", ""],
    ["Round", "Investor Return", "Return (%)", "IRR (%)"],
    ...jv.roundReturns.map((r) => [r.roundName, r.investorReturn, r.investorReturnPercent, r.irr]),
  ];
  downloadCSV(`${prefix}-jv.csv`, rowsToCSV(jvRows));
}

export function exportAllScenariosToCSV(results: FeasibilityResults, projectName: string) {
  for (const scenario of results.scenarios) {
    exportScenarioToCSV(scenario, projectName);
  }
}
