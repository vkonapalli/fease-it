import { z } from "zod";

export const ProjectScenarioSchema = z.enum([
  "build-sell",
  "sell-1-hold-1",
  "rental-hold",
  "land-plus-build",
  "build-hold",
  "sda-hold",
]);

export const GSTTreatmentSchema = z.enum([
  "gst-free",
  "margin-scheme",
  "full-gst",
  "input-taxed",
  "going-concern",
]);

export const AcquisitionCostItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  isPercentage: z.boolean(),
  gstTreatment: z.enum(["free", "inclusive", "exclusive"]),
});

export const AcquisitionInputsSchema = z.object({
  purchasePrice: z.number(),
  landArea: z.number(),
  location: z.string(),
  address: z.string(),
  suburb: z.string(),
  postcode: z.string(),
  costs: z.array(AcquisitionCostItemSchema),
  landTaxAuto: z.boolean(),
  landTaxOverride: z.number().optional(),
  landValue: z.number(),
});

// For brevity, I'll add a catch-all for the full FeasibilityInputs for now
// and refine the sub-schemas as needed for specific actions.
export const FeasibilityInputsSchema = z.object({
  name: z.string(),
  scenario: ProjectScenarioSchema,
  property: AcquisitionInputsSchema,
  development: z.any(),
  financing: z.any(),
  revenue: z.any(),
  operating: z.any(),
  jv: z.any(),
  cashflow: z.any(),
  budgetVsActual: z.any(),
  sda: z.any(),
  capitalStack: z.any(),
  capitalSpread: z.any(),
});

export const ScenarioActionSchema = z.object({
  intent: z.enum(["create-scenario", "rename-scenario", "delete-scenario", "duplicate-scenario", "update-scenario"]),
  id: z.string().optional(),
  name: z.string().optional(),
  inputs: z.string().optional(), // Often sent as stringified JSON in forms
  projectId: z.string().optional(),
  localId: z.string().optional(),
});
