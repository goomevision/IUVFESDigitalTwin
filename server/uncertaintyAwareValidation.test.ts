import { describe, expect, it } from "vitest";
import { combineIndependentUncertainty, validateWithUncertainty } from "./uncertaintyAwareValidation";

describe("uncertainty aware validation", () => {
  const criteria = {
    metric: "pressure",
    unit: "kPa",
    maxMeanAbsoluteError: 4,
    maxAbsoluteError: 8,
    minimumComparedPoints: 3,
    measuredUncertainty: 1,
    modelUncertainty: 1,
  };

  it("combines independent uncertainty using RSS", () => {
    expect(combineIndependentUncertainty(3, 4)).toBe(5);
  });

  it("allows declared independent uncertainty without hiding the raw errors", () => {
    const result = validateWithUncertainty(criteria, 5, 5, 9);
    expect(result.combinedUncertainty).toBeCloseTo(Math.sqrt(2));
    expect(result.meanAbsoluteError).toBe(5);
    expect(result.maxAbsoluteError).toBe(9);
    expect(result.status).toBe("VALIDATED");
  });

  it("rejects invalid uncertainty values", () => {
    expect(() => combineIndependentUncertainty(-1)).toThrow();
  });
});
