import { describe, it, expect } from "vitest";
import { calculateFeasibility } from "./index";
import { createBaseInputs } from "../templates";

describe("calculateFeasibility", () => {
  it("should calculate basic sell-all feasibility correctly", () => {
    const inputs = createBaseInputs();
    const result = calculateFeasibility(inputs);

    expect(result.activeScenario).toBe("sell-all");
    const activeResult = result.scenarios.find(s => s.scenario === "sell-all");
    expect(activeResult).toBeDefined();

    if (activeResult) {
      // Basic checks for 1M purchase + 1.2M sales
      expect(activeResult.totalRevenue).toBeGreaterThan(0);
      expect(activeResult.totalCosts).toBeGreaterThan(1000000);
      expect(activeResult.profit).toBeDefined();
    }
  });

  it("should handle zero inputs gracefully", () => {
    const inputs = createBaseInputs();
    inputs.property.purchasePrice = 0;
    inputs.development.lots = [];
    
    const result = calculateFeasibility(inputs);
    expect(result).toBeDefined();
  });
});
