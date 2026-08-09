import { describe, expect, it } from "vitest";
import { validateTimeSeriesComparison } from "./validationEngine";

describe("validation engine", () => {
  const criteria = {
    metric: "pressure",
    unit: "kPa",
    maxMeanAbsoluteError: 5,
    maxAbsoluteError: 10,
    minimumComparedPoints: 3,
  };

  it("returns VALIDATED when all criteria pass", () => {
    const result = validateTimeSeriesComparison(criteria, 5, 2, 7);
    expect(result.status).toBe("VALIDATED");
  });

  it("returns PARTIALLY_VALIDATED when one criterion passes", () => {
    const result = validateTimeSeriesComparison(criteria, 5, 2, 12);
    expect(result.status).toBe("PARTIALLY_VALIDATED");
  });

  it("returns NOT_VALIDATED when both error criteria fail", () => {
    const result = validateTimeSeriesComparison(criteria, 5, 8, 12);
    expect(result.status).toBe("NOT_VALIDATED");
  });

  it("returns INSUFFICIENT_DATA when no comparison points exist", () => {
    const result = validateTimeSeriesComparison(criteria, 0);
    expect(result.status).toBe("INSUFFICIENT_DATA");
  });
});
