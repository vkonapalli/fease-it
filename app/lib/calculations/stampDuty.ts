/**
 * Australian Stamp Duty Calculator
 * Returns stamp duty (land transfer duty) for a given state and purchase price.
 * Rates updated to 2024–2025 official thresholds.
 * No first-home buyer concessions are applied.
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

function roundUpToPart(value: number, part: number): number {
  return Math.ceil(value / part) * part;
}

function vicStampDuty(price: number): number {
  if (price <= 25000) {
    return price * 0.014;
  }
  if (price <= 130000) {
    return 350 + (price - 25000) * 0.024;
  }
  if (price <= 960000) {
    return 2870 + (price - 130000) * 0.06;
  }
  if (price <= 2000000) {
    return price * 0.055;
  }
  // Marginal rate: 5.5% on first $2M, 6.5% on remainder
  return 110000 + (price - 2000000) * 0.065;
}

function nswStampDuty(price: number): number {
  if (price <= 17000) {
    return Math.max(price * 0.0125, 20);
  }
  if (price <= 36000) {
    return 212 + (price - 17000) * 0.015;
  }
  if (price <= 97000) {
    return 497 + (price - 36000) * 0.0175;
  }
  if (price <= 364000) {
    return 1564 + (price - 97000) * 0.035;
  }
  if (price <= 1212000) {
    return 10909 + (price - 364000) * 0.045;
  }
  if (price <= 3636000) {
    return 49069 + (price - 1212000) * 0.055;
  }
  // Premium duty for residential properties over threshold
  return 182389 + (price - 3636000) * 0.07;
}

function qldStampDuty(price: number): number {
  if (price <= 5000) {
    return 0;
  }
  if (price <= 75000) {
    return (roundUpToPart(price - 5000, 100) / 100) * 1.5;
  }
  if (price <= 540000) {
    return 1050 + (roundUpToPart(price - 75000, 100) / 100) * 3.5;
  }
  if (price <= 1000000) {
    return 17325 + (roundUpToPart(price - 540000, 100) / 100) * 4.5;
  }
  return 38025 + (roundUpToPart(price - 1000000, 100) / 100) * 5.75;
}

function saStampDuty(price: number): number {
  if (price <= 12000) {
    return (roundUpToPart(price, 100) / 100) * 1.0;
  }
  if (price <= 30000) {
    return 120 + (roundUpToPart(price - 12000, 100) / 100) * 2.0;
  }
  if (price <= 50000) {
    return 480 + (roundUpToPart(price - 30000, 100) / 100) * 3.0;
  }
  if (price <= 100000) {
    return 1080 + (roundUpToPart(price - 50000, 100) / 100) * 3.5;
  }
  if (price <= 200000) {
    return 2830 + (roundUpToPart(price - 100000, 100) / 100) * 4.0;
  }
  if (price <= 250000) {
    return 6830 + (roundUpToPart(price - 200000, 100) / 100) * 4.25;
  }
  if (price <= 300000) {
    return 8955 + (roundUpToPart(price - 250000, 100) / 100) * 4.75;
  }
  if (price <= 500000) {
    return 11330 + (roundUpToPart(price - 300000, 100) / 100) * 5.0;
  }
  return 21330 + (roundUpToPart(price - 500000, 100) / 100) * 5.5;
}

function waStampDuty(price: number): number {
  if (price <= 120000) {
    return (roundUpToPart(price, 100) / 100) * 1.9;
  }
  if (price <= 150000) {
    return 2280 + (roundUpToPart(price - 120000, 100) / 100) * 2.85;
  }
  if (price <= 360000) {
    return 3135 + (roundUpToPart(price - 150000, 100) / 100) * 3.8;
  }
  if (price <= 725000) {
    return 11115 + (roundUpToPart(price - 360000, 100) / 100) * 4.75;
  }
  return 28453 + (roundUpToPart(price - 725000, 100) / 100) * 5.15;
}

function tasStampDuty(price: number): number {
  if (price <= 3000) {
    return 50;
  }
  if (price <= 25000) {
    return 50 + (roundUpToPart(price - 3000, 100) / 100) * 1.75;
  }
  if (price <= 75000) {
    return 435 + (roundUpToPart(price - 25000, 100) / 100) * 2.25;
  }
  if (price <= 200000) {
    return 1560 + (roundUpToPart(price - 75000, 100) / 100) * 3.5;
  }
  if (price <= 375000) {
    return 5935 + (roundUpToPart(price - 200000, 100) / 100) * 4.0;
  }
  if (price <= 725000) {
    return 12935 + (roundUpToPart(price - 375000, 100) / 100) * 4.25;
  }
  return 27810 + (roundUpToPart(price - 725000, 100) / 100) * 4.5;
}

function actStampDuty(price: number): number {
  if (price <= 200000) {
    return (roundUpToPart(price, 100) / 100) * 1.2;
  }
  if (price <= 300000) {
    return 2400 + (roundUpToPart(price - 200000, 100) / 100) * 2.2;
  }
  if (price <= 500000) {
    return 4600 + (roundUpToPart(price - 300000, 100) / 100) * 3.4;
  }
  if (price <= 750000) {
    return 11400 + (roundUpToPart(price - 500000, 100) / 100) * 4.32;
  }
  if (price <= 1000000) {
    return 22200 + (roundUpToPart(price - 750000, 100) / 100) * 5.9;
  }
  if (price <= 1455000) {
    return 36950 + (roundUpToPart(price - 1000000, 100) / 100) * 6.4;
  }
  // Flat rate of $4.54 per $100 on total value for properties > $1,455,000
  return price * 0.0454;
}

function ntStampDuty(price: number): number {
  if (price <= 525000) {
    // Dutiable value rounded down to nearest $100
    const rounded = Math.floor(price / 100) * 100;
    const v = rounded / 1000;
    return 0.06571441 * v * v + 15 * v;
  }
  if (price <= 3000000) {
    return price * 0.0495;
  }
  return price * 0.0575;
}

export function calculateStampDuty(
  state: string,
  purchasePrice: number
): number {
  const price = Math.max(0, purchasePrice);
  switch (state.toUpperCase()) {
    case "VIC":
      return vicStampDuty(price);
    case "NSW":
      return nswStampDuty(price);
    case "QLD":
      return qldStampDuty(price);
    case "SA":
      return saStampDuty(price);
    case "WA":
      return waStampDuty(price);
    case "TAS":
      return tasStampDuty(price);
    case "ACT":
      return actStampDuty(price);
    case "NT":
      return ntStampDuty(price);
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
