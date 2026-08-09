import { describe, expect, it } from "vitest";
import { buildUncertaintyBudget } from "./uncertaintyBudget";

describe("uncertainty budget", () => {
  const source = (id: string, value: number, independent = true) => ({
    id,
    name: id,
    value,
    unit: "kPa",
    method: "calibration record",
    scope: "pressure measurement",
    provenanceId: `PROV-${id}`,
    independent,
  });

  it("combines complete independent sources using RSS", () => {
    const budget = buildUncertaintyBudget("pressure", "kPa", [source("sensor", 3), source("model", 4)]);
    expect(budget.method).toBe("RSS_INDEPENDENT_ONLY");
    expect(budget.combinedUncertainty).toBe(5);
    expect(budget.blockers).toHaveLength(0);
  });

  it("requires covariance treatment for dependent sources", () => {
    const budget = buildUncertaintyBudget("pressure", "kPa", [source("sensor", 3, false)]);
    expect(budget.method).toBe("COVARIANCE_REQUIRED");
    expect(budget.blockers.length).toBeGreaterThan(0);
  });

  it("blocks unit mismatch", () => {
    const budget = buildUncertaintyBudget("pressure", "kPa", [{ ...source("sensor", 1), unit: "Pa" }]);
    expect(budget.method).toBe("INCOMPLETE");
    expect(budget.blockers.some((item) => item.includes("Unit mismatch"))).toBe(true);
  });
});
