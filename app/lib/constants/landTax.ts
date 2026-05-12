// ============================================================
// Australian Land Tax Reference Data (2024–2025)
// Approximate standard rates for investment properties.
// No first-home, PPR, or foreign-surcharge concessions applied.
// These should be reviewed and updated periodically.
// ============================================================

export type AustralianState =
  | "VIC"
  | "NSW"
  | "QLD"
  | "SA"
  | "WA"
  | "TAS"
  | "ACT"
  | "NT";

export interface LandTaxBracket {
  threshold: number;
  rate: number;        // % above threshold
  baseTax: number;     // flat tax at this bracket
}

export interface LandTaxConfig {
  state: AustralianState;
  label: string;
  // General / individual owner brackets
  generalBrackets: LandTaxBracket[];
  // Trust / company brackets (if different)
  trustBrackets?: LandTaxBracket[];
  // Minimum taxable threshold (site value)
  threshold: number;
}

// ------------------------------------------------------------------
// Victoria (VIC) – 2024-25
// Source: State Revenue Office Victoria
// General threshold ~$300,000 (but calculation starts from $0 with
// a progressive scale).  Simplified tiered model below.
// ------------------------------------------------------------------
const vicGeneral: LandTaxBracket[] = [
  { threshold: 0, rate: 0, baseTax: 0 },
  { threshold: 300_000, rate: 0.005, baseTax: 0 },
  { threshold: 600_000, rate: 0.0065, baseTax: 1_500 },
  { threshold: 1_000_000, rate: 0.009, baseTax: 4_100 },
  { threshold: 1_800_000, rate: 0.0125, baseTax: 11_300 },
  { threshold: 3_000_000, rate: 0.0165, baseTax: 26_300 },
];

// Trusts in VIC pay a surcharge rate on the whole value above threshold
const vicTrust: LandTaxBracket[] = [
  { threshold: 0, rate:0, baseTax:0 },
  { threshold: 250_000, rate: 0.00575, baseTax: 0 },
  { threshold: 600_000, rate: 0.00725, baseTax: 2_012.50 },
  { threshold: 1_000_000, rate: 0.0095, baseTax: 4_537.50 },
  { threshold: 1_800_000, rate: 0.013, baseTax: 12_137.50 },
  { threshold: 3_000_000, rate: 0.017, baseTax: 27_537.50 },
];

// ------------------------------------------------------------------
// New South Wales (NSW) – 2024-25
// Source: Revenue NSW
// General threshold $1,075,000.  Trust threshold $739,000.
// ------------------------------------------------------------------
const nswGeneral: LandTaxBracket[] = [
  { threshold: 0, rate: 0, baseTax: 0 },
  { threshold: 1_075_000, rate: 0.016, baseTax: 100 },
  { threshold: 6_571_000, rate: 0.02, baseTax: 88_036 },
];

const nswTrust: LandTaxBracket[] = [
  { threshold: 0, rate: 0, baseTax: 0 },
  { threshold: 739_000, rate: 0.02, baseTax: 100 },
  { threshold: 6_571_000, rate: 0.02, baseTax: 100 }, // same 2% above trust threshold
];

// ------------------------------------------------------------------
// Queensland (QLD) – 2024-25
// Source: Queensland Revenue Office
// Threshold $600,000 (companies/trusts $350,000).
// ------------------------------------------------------------------
const qldGeneral: LandTaxBracket[] = [
  { threshold: 0, rate: 0, baseTax: 0 },
  { threshold: 600_000, rate: 0.01, baseTax: 500 },
  { threshold: 1_000_000, rate: 0.0165, baseTax: 4_500 },
  { threshold: 3_000_000, rate: 0.0125, baseTax: 37_500 },
  { threshold: 5_000_000, rate: 0.0175, baseTax: 62_500 },
  { threshold: 10_000_000, rate: 0.0225, baseTax: 150_000 },
];

const qldTrust: LandTaxBracket[] = [
  { threshold: 0, rate: 0, baseTax: 0 },
  { threshold: 350_000, rate: 0.01, baseTax: 500 },
  { threshold: 1_000_000, rate: 0.0165, baseTax: 7_000 },
  { threshold: 3_000_000, rate: 0.0125, baseTax: 40_000 },
  { threshold: 5_000_000, rate: 0.0175, baseTax: 65_000 },
  { threshold: 10_000_000, rate: 0.0225, baseTax: 152_500 },
];

// ------------------------------------------------------------------
// South Australia (SA) – 2024-25
// Source: Revenue SA
// Threshold $668,000
// ------------------------------------------------------------------
const saGeneral: LandTaxBracket[] = [
  { threshold: 0, rate: 0, baseTax: 0 },
  { threshold: 668_000, rate: 0.005, baseTax: 0 },
  { threshold: 1_158_000, rate: 0.0165, baseTax: 2_450 },
  { threshold: 2_215_000, rate: 0.025, baseTax: 19_890 },
  { threshold: 5_000_000, rate: 0.0275, baseTax: 84_315 },
  { threshold: 10_000_000, rate: 0.03, baseTax: 221_815 },
];

// ------------------------------------------------------------------
// Western Australia (WA) – 2024-25
// Source: Department of Finance WA
// Threshold $300,000
// ------------------------------------------------------------------
const waGeneral: LandTaxBracket[] = [
  { threshold: 0, rate: 0, baseTax: 0 },
  { threshold: 300_000, rate: 0.005, baseTax: 0 },
  { threshold: 420_000, rate: 0.0115, baseTax: 600 },
  { threshold: 1_000_000, rate: 0.0132, baseTax: 1_380 },
  { threshold: 1_800_000, rate: 0.0167, baseTax: 9_040 },
  { threshold: 5_000_000, rate: 0.02, baseTax: 62_480 },
  { threshold: 11_000_000, rate: 0.0227, baseTax: 182_480 },
];

// ------------------------------------------------------------------
// Tasmania (TAS) – 2024-25
// Source: State Revenue Office Tasmania
// Threshold $100,000
// ------------------------------------------------------------------
const tasGeneral: LandTaxBracket[] = [
  { threshold: 0, rate: 0, baseTax: 0 },
  { threshold: 100_000, rate: 0.0055, baseTax: 50 },
  { threshold: 500_000, rate: 0.0075, baseTax: 2_250 },
  { threshold: 1_000_000, rate: 0.01, baseTax: 6_000 },
  { threshold: 2_000_000, rate: 0.0125, baseTax: 16_000 },
];

// ------------------------------------------------------------------
// Australian Capital Territory (ACT) – 2024-25
// Source: ACT Revenue Office
// Uses a fixed charge + progressive rate model.
// Simplified below.
// ------------------------------------------------------------------
const actGeneral: LandTaxBracket[] = [
  { threshold: 0, rate: 0, baseTax: 0 },
  { threshold: 150_000, rate: 0.006, baseTax: 0 },
  { threshold: 275_000, rate: 0.0075, baseTax: 750 },
  { threshold: 2_000_000, rate: 0.0105, baseTax: 14_437.50 },
  { threshold: 2_400_000, rate: 0.0135, baseTax: 56_437.50 },
];

// ------------------------------------------------------------------
// Northern Territory (NT)
// No land tax.
// ------------------------------------------------------------------
const ntGeneral: LandTaxBracket[] = [
  { threshold: 0, rate: 0, baseTax: 0 },
];

// ------------------------------------------------------------------
// Registry
// ------------------------------------------------------------------
export const LAND_TAX_CONFIGS: Record<AustralianState, LandTaxConfig> = {
  VIC: { state: "VIC", label: "Victoria", generalBrackets: vicGeneral, trustBrackets: vicTrust, threshold: 300_000 },
  NSW: { state: "NSW", label: "New South Wales", generalBrackets: nswGeneral, trustBrackets: nswTrust, threshold: 1_075_000 },
  QLD: { state: "QLD", label: "Queensland", generalBrackets: qldGeneral, trustBrackets: qldTrust, threshold: 600_000 },
  SA:  { state: "SA",  label: "South Australia", generalBrackets: saGeneral, threshold: 668_000 },
  WA:  { state: "WA",  label: "Western Australia", generalBrackets: waGeneral, threshold: 300_000 },
  TAS: { state: "TAS", label: "Tasmania", generalBrackets: tasGeneral, threshold: 100_000 },
  ACT: { state: "ACT", label: "Australian Capital Territory", generalBrackets: actGeneral, threshold: 150_000 },
  NT:  { state: "NT",  label: "Northern Territory", generalBrackets: ntGeneral, threshold: 0 },
};

/**
 * Calculate approximate land tax for a given state and unimproved land value.
 * @param state – Australian state code
 * @param landValue – unimproved land value (site value)
 * @param isTrust – whether owned by trust/company (uses trust brackets where available)
 */
export function calculateLandTax(
  state: AustralianState | string,
  landValue: number,
  isTrust = false
): number {
  const cfg = LAND_TAX_CONFIGS[state.toUpperCase() as AustralianState];
  if (!cfg) return 0;

  const brackets = (isTrust && cfg.trustBrackets) ? cfg.trustBrackets : cfg.generalBrackets;
  if (!brackets || brackets.length === 0) return 0;

  // Find the highest applicable bracket
  let applicable = brackets[0];
  for (const b of brackets) {
    if (landValue >= b.threshold) {
      applicable = b;
    } else {
      break;
    }
  }

  const taxable = Math.max(0, landValue - applicable.threshold);
  return applicable.baseTax + taxable * (applicable.rate);
}

/** Sum of land tax over a holding period (e.g. project timeline in years). */
export function calculateLandTaxOverPeriod(
  state: AustralianState | string,
  landValue: number,
  years: number,
  isTrust = false
): number {
  const annual = calculateLandTax(state, landValue, isTrust);
  return annual * Math.max(0, years);
}
