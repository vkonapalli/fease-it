import type { FinancingInputs } from "~/types";

export interface LoanCalculation {
  loanAmount: number;
  cashRequired: number;
  monthlyPayment: number;
  establishmentFee: number;
  brokerFee: number;
  settlementFee: number;
  deferredFee: number;
  totalFees: number;
  totalInterestOverTerm: number;
  // Second loan
  secondLoanAmount?: number;
  secondMonthlyPayment?: number;
}

function getLoanBase(
  financing: FinancingInputs,
  propertyValue: number,
  netGrv: number,
  netProjectCosts: number,
  isSecond: boolean
): number {
  const base = isSecond
    ? (financing.secondLvrBase ?? financing.lvrBase)
    : financing.lvrBase;
  return base === "net-grv" ? netGrv : netProjectCosts;
}

export function calculateLoan({
  propertyValue,
  financing,
  totalCosts,
  netGrv = propertyValue,
  netProjectCosts = totalCosts,
}: {
  propertyValue: number;
  financing: FinancingInputs;
  totalCosts: number;
  netGrv?: number;
  netProjectCosts?: number;
}): LoanCalculation {
  const {
    lvr,
    interestRate,
    loanTermMonths,
    establishmentFeePercent,
    brokerFeePercent,
    settlementFee,
    deferredFeeMonths,
    secondLvr,
    secondInterestRate,
  } = financing;

  // Primary loan
  const primaryBase = getLoanBase(financing, propertyValue, netGrv, netProjectCosts, false);
  const loanAmount = primaryBase * (lvr / 100);
  const equityRequired = propertyValue - loanAmount;

  // Fees based on loan amount
  const establishmentFee = loanAmount * (establishmentFeePercent / 100);
  const brokerFee = loanAmount * (brokerFeePercent / 100);
  const deferredFee = (loanAmount * (interestRate / 100) / 12) * deferredFeeMonths;
  const totalFees = establishmentFee + brokerFee + settlementFee + deferredFee;

  // Total cash required = equity + all other costs + fees
  const cashRequired = equityRequired + totalCosts - loanAmount + totalFees;

  // Monthly interest-only payment
  const monthlyPayment = (loanAmount * (interestRate / 100)) / 12;
  const totalInterestOverTerm = monthlyPayment * loanTermMonths;

  // Second / mezzanine loan
  let secondLoanAmount: number | undefined;
  let secondMonthlyPayment: number | undefined;

  if (secondLvr && secondLvr > 0) {
    const secondBase = getLoanBase(financing, propertyValue, netGrv, netProjectCosts, true);
    secondLoanAmount = secondBase * (secondLvr / 100);
    secondMonthlyPayment = (secondLoanAmount * ((secondInterestRate ?? interestRate) / 100)) / 12;
  }

  return {
    loanAmount,
    cashRequired: Math.max(0, cashRequired),
    monthlyPayment,
    establishmentFee,
    brokerFee,
    settlementFee,
    deferredFee,
    totalFees,
    totalInterestOverTerm,
    secondLoanAmount,
    secondMonthlyPayment,
  };
}

/**
 * Compare multiple LVR scenarios side-by-side
 */
export function compareLVRScenarios(
  propertyValue: number,
  scenarios: { lvr: number; interestRate: number }[],
  totalCosts: number,
  financing: FinancingInputs,
  netGrv?: number,
  netProjectCosts?: number
): {
  lvr: number;
  loan: number;
  cashRequired: number;
  monthlyPayment: number;
  totalInterest: number;
}[] {
  return scenarios.map(({ lvr, interestRate }) => {
    const calc = calculateLoan({
      propertyValue,
      financing: { ...financing, lvr, interestRate },
      totalCosts,
      netGrv,
      netProjectCosts,
    });

    return {
      lvr,
      loan: calc.loanAmount,
      cashRequired: calc.cashRequired,
      monthlyPayment: calc.monthlyPayment,
      totalInterest: calc.totalInterestOverTerm,
    };
  });
}
