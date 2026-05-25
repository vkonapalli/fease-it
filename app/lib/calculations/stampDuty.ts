/**
 * Australian Stamp Duty Calculator
 * Returns stamp duty (land transfer duty) for a given state and purchase price.
 * Rates updated to 2024–2025 official thresholds.
 * No first-home buyer concessions are applied.
 *
 * Architecture: rule-based bracket system. Each state declares an ordered array of
 * { threshold, base, rate, type } objects. A generic engine walks the brackets,
 * eliminating the entire class of "flat vs marginal" and "missing bracket" bugs.
 */

export type AustralianState =
  | "VIC"
  | "NSW"
  | "QLD"
  | "SA"
  | "WA"
  | "TAS"
  | "ACT"
  | "NT";

export const AUSTRALIAN_STATES: { label: string; value: AustralianState }[] = [
  { label: "Victoria", value: "VIC" },
  { label: "New South Wales", value: "NSW" },
  { label: "Queensland", value: "QLD" },
  { label: "South Australia", value: "SA" },
  { label: "Western Australia", value: "WA" },
  { label: "Tasmania", value: "TAS" },
  { label: "Australian Capital Territory", value: "ACT" },
  { label: "Northern Territory", value: "NT" },
];

/* ─── Bracket Types ─────────────────────────────────────────────────────── */

type BracketType = "marginal" | "flat" | "per100" | "formula";

interface StampDutyBracket {
  /** Lower bound of this bracket (strict). Price must be > threshold to fall here. */
  threshold: number;
  /** Base duty payable at the threshold. */
  base: number;
  /** Rate applied either per-dollar or per-$100-unit depending on type. */
  rate: number;
  type: BracketType;
  /** Minimum duty for this bracket (only NSW first bracket uses this). */
  minDuty?: number;
  /** Custom formula for jurisdictions with non-linear brackets (e.g. NT ≤ $525k). */
  formula?: (price: number) => number;
}

/* ─── Generic Calculator ───────────────────────────────────────────────── */

function calculateFromRules(price: number, rules: StampDutyBracket[]): number {
  // Find the applicable rule: the bracket with the highest threshold that is
  // strictly less than the price. This naturally handles boundary conditions
  // (e.g. price == $25,000 stays in the $0–$25,000 bracket).
  let rule = rules[0];
  for (let i = 1; i < rules.length; i++) {
    if (price > rules[i].threshold) {
      rule = rules[i];
    } else {
      break;
    }
  }

  let duty: number;
  switch (rule.type) {
    case "flat":
      duty = price * rule.rate;
      break;
    case "per100":
      duty = rule.base + Math.ceil((price - rule.threshold) / 100) * rule.rate;
      break;
    case "formula":
      duty = rule.formula!(price);
      break;
    case "marginal":
    default:
      duty = rule.base + (price - rule.threshold) * rule.rate;
      break;
  }

  return Math.max(duty, rule.minDuty ?? 0);
}

/* ─── State Bracket Tables ─────────────────────────────────────────────── */

const VIC_BRACKETS: StampDutyBracket[] = [
  // $0 – $25,000
  { threshold: 0, base: 0, rate: 0.014, type: "marginal" },
  // $25,001 – $130,000
  { threshold: 25000, base: 350, rate: 0.024, type: "marginal" },
  // $130,001 – $960,000
  { threshold: 130000, base: 2870, rate: 0.06, type: "marginal" },
  // $960,001 – $2,000,000  (flat 5.5% on total)
  { threshold: 960000, base: 0, rate: 0.055, type: "flat" },
  // > $2,000,000  (marginal: 5.5% on first $2M + 6.5% on remainder)
  { threshold: 2000000, base: 110000, rate: 0.065, type: "marginal" },
];

const NSW_BRACKETS: StampDutyBracket[] = [
  // $0 – $17,000  ($1.25 per $100, minimum $20)
  { threshold: 0, base: 0, rate: 0.0125, type: "marginal", minDuty: 20 },
  // $17,001 – $36,000
  { threshold: 17000, base: 212, rate: 0.015, type: "marginal" },
  // $36,001 – $97,000
  { threshold: 36000, base: 497, rate: 0.0175, type: "marginal" },
  // $97,001 – $364,000
  { threshold: 97000, base: 1564, rate: 0.035, type: "marginal" },
  // $364,001 – $1,212,000
  { threshold: 364000, base: 10909, rate: 0.045, type: "marginal" },
  // $1,212,001 – $3,636,000
  { threshold: 1212000, base: 49069, rate: 0.055, type: "marginal" },
  // > $3,636,000  (premium duty)
  { threshold: 3636000, base: 182389, rate: 0.07, type: "marginal" },
];

const QLD_BRACKETS: StampDutyBracket[] = [
  // $0 – $5,000
  { threshold: 0, base: 0, rate: 0, type: "marginal" },
  // $5,001 – $75,000
  { threshold: 5000, base: 0, rate: 1.5, type: "per100" },
  // $75,001 – $540,000
  { threshold: 75000, base: 1050, rate: 3.5, type: "per100" },
  // $540,001 – $1,000,000
  { threshold: 540000, base: 17325, rate: 4.5, type: "per100" },
  // > $1,000,000
  { threshold: 1000000, base: 38025, rate: 5.75, type: "per100" },
];

const SA_BRACKETS: StampDutyBracket[] = [
  // $0 – $12,000
  { threshold: 0, base: 0, rate: 1.0, type: "per100" },
  // $12,001 – $30,000
  { threshold: 12000, base: 120, rate: 2.0, type: "per100" },
  // $30,001 – $50,000
  { threshold: 30000, base: 480, rate: 3.0, type: "per100" },
  // $50,001 – $100,000
  { threshold: 50000, base: 1080, rate: 3.5, type: "per100" },
  // $100,001 – $200,000
  { threshold: 100000, base: 2830, rate: 4.0, type: "per100" },
  // $200,001 – $250,000
  { threshold: 200000, base: 6830, rate: 4.25, type: "per100" },
  // $250,001 – $300,000
  { threshold: 250000, base: 8955, rate: 4.75, type: "per100" },
  // $300,001 – $500,000
  { threshold: 300000, base: 11330, rate: 5.0, type: "per100" },
  // > $500,000
  { threshold: 500000, base: 21330, rate: 5.5, type: "per100" },
];

const WA_BRACKETS: StampDutyBracket[] = [
  // $0 – $120,000
  { threshold: 0, base: 0, rate: 1.9, type: "per100" },
  // $120,001 – $150,000
  { threshold: 120000, base: 2280, rate: 2.85, type: "per100" },
  // $150,001 – $360,000
  { threshold: 150000, base: 3135, rate: 3.8, type: "per100" },
  // $360,001 – $725,000
  { threshold: 360000, base: 11115, rate: 4.75, type: "per100" },
  // > $725,000
  { threshold: 725000, base: 28453, rate: 5.15, type: "per100" },
];

const TAS_BRACKETS: StampDutyBracket[] = [
  // $0 – $3,000  (flat $50)
  { threshold: 0, base: 50, rate: 0, type: "marginal" },
  // $3,001 – $25,000
  { threshold: 3000, base: 50, rate: 1.75, type: "per100" },
  // $25,001 – $75,000
  { threshold: 25000, base: 435, rate: 2.25, type: "per100" },
  // $75,001 – $200,000
  { threshold: 75000, base: 1560, rate: 3.5, type: "per100" },
  // $200,001 – $375,000
  { threshold: 200000, base: 5935, rate: 4.0, type: "per100" },
  // $375,001 – $725,000
  { threshold: 375000, base: 12935, rate: 4.25, type: "per100" },
  // > $725,000
  { threshold: 725000, base: 27810, rate: 4.5, type: "per100" },
];

const ACT_BRACKETS: StampDutyBracket[] = [
  // $0 – $200,000
  { threshold: 0, base: 0, rate: 1.2, type: "per100" },
  // $200,001 – $300,000
  { threshold: 200000, base: 2400, rate: 2.2, type: "per100" },
  // $300,001 – $500,000
  { threshold: 300000, base: 4600, rate: 3.4, type: "per100" },
  // $500,001 – $750,000
  { threshold: 500000, base: 11400, rate: 4.32, type: "per100" },
  // $750,001 – $1,000,000
  { threshold: 750000, base: 22200, rate: 5.9, type: "per100" },
  // $1,000,001 – $1,455,000
  { threshold: 1000000, base: 36950, rate: 6.4, type: "per100" },
  // > $1,455,000  (flat $4.54 per $100 on total)
  { threshold: 1455000, base: 0, rate: 0.0454, type: "flat" },
];

const NT_BRACKETS: StampDutyBracket[] = [
  // $0 – $525,000  (non-linear formula)
  {
    threshold: 0,
    base: 0,
    rate: 0,
    type: "formula",
    formula: (price: number) => {
      const rounded = Math.floor(price / 100) * 100;
      const v = rounded / 1000;
      return 0.06571441 * v * v + 15 * v;
    },
  },
  // $525,001 – $3,000,000
  { threshold: 525000, base: 0, rate: 0.0495, type: "flat" },
  // > $3,000,000
  { threshold: 3000000, base: 0, rate: 0.0575, type: "flat" },
];

/* ─── Public API ──────────────────────────────────────────────────────── */

export function calculateStampDuty(
  state: string,
  purchasePrice: number
): number {
  const price = Math.max(0, purchasePrice);
  switch (state.toUpperCase()) {
    case "VIC":
      return calculateFromRules(price, VIC_BRACKETS);
    case "NSW":
      return calculateFromRules(price, NSW_BRACKETS);
    case "QLD":
      return calculateFromRules(price, QLD_BRACKETS);
    case "SA":
      return calculateFromRules(price, SA_BRACKETS);
    case "WA":
      return calculateFromRules(price, WA_BRACKETS);
    case "TAS":
      return calculateFromRules(price, TAS_BRACKETS);
    case "ACT":
      return calculateFromRules(price, ACT_BRACKETS);
    case "NT":
      return calculateFromRules(price, NT_BRACKETS);
    default:
      return 0;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
