/**
 * Australian GST Calculation Engine
 * Supports all major GST treatments for property development
 *
 * Treatments:
 * - gst-free: No GST payable (existing residential subdivision)
 * - margin-scheme: GST on (sale - costBase) × 10%
 * - full-gst: GST on sale × 10%
 * - input-taxed: No GST, but no input credits either
 * - going-concern: GST-free business sale
 */

import type { GSTConfig, GSTTreatment } from "@fease-it/schemas";

export const GST_RATE = 0.1;

export function calculateGST(
  salePrice: number,
  purchasePrice: number,
  numLots: number,
  config: GSTConfig
): { gstPerLot: number; totalGst: number; netRevenue: number } {
  const { treatment, costBasePerLot, gstRate = GST_RATE } = config;

  switch (treatment) {
    case "gst-free":
    case "going-concern":
    case "input-taxed":
      return {
        gstPerLot: 0,
        totalGst: 0,
        netRevenue: salePrice * numLots,
      };

    case "margin-scheme": {
      // Cost base per lot defaults to purchasePrice / numLots
      const base = costBasePerLot ?? purchasePrice / numLots;
      const margin = Math.max(0, salePrice - base);
      const gstPerLot = margin * gstRate;
      const totalGst = gstPerLot * numLots;
      return {
        gstPerLot,
        totalGst,
        netRevenue: salePrice * numLots - totalGst,
      };
    }

    case "full-gst": {
      const gstPerLot = salePrice * gstRate;
      const totalGst = gstPerLot * numLots;
      return {
        gstPerLot,
        totalGst,
        netRevenue: salePrice * numLots - totalGst,
      };
    }

    default:
      return {
        gstPerLot: 0,
        totalGst: 0,
        netRevenue: salePrice * numLots,
      };
  }
}

export function calculateGSTForLot(
  salePrice: number,
  costBase: number,
  treatment: GSTTreatment
): number {
  switch (treatment) {
    case "margin-scheme":
      return Math.max(0, salePrice - costBase) * GST_RATE;
    case "full-gst":
      return salePrice * GST_RATE;
    default:
      return 0;
  }
}

export function getGSTLabel(treatment: GSTTreatment): string {
  const labels: Record<GSTTreatment, string> = {
    "gst-free": "GST-Free (Existing Residential)",
    "margin-scheme": "Margin Scheme",
    "full-gst": "Full GST (10%)",
    "input-taxed": "Input Taxed (Rental)",
    "going-concern": "Going Concern (GST-Free)",
  };
  return labels[treatment];
}
