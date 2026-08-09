import { describe, expect, it } from "vitest";
import { validateModelRevision } from "./modelRevisionValidation";

describe("model revision validation", () => {
  it("validates a revision when all measured comparisons are within explicit tolerance", () => {
    const report = validateModelRevision("PATCHOULI-OIL", "v2", [
      { metric: { name: "evaporatedMass", value: 2.05, unit: "kg" }, measuredValue: 2, tolerance: 0.1 },
      { metric: { name: "processTime", value: 101, unit: "s" }, measuredValue: 100, tolerance: 2 },
    ]);
    expect(report.overall).toBe("VALIDATED");
    expect(report.passedMetrics).toBe(2);
  });

  it("rejects a revision when any metric exceeds its declared tolerance", () => {
    const report = validateModelRevision("PATCHOULI-OIL", "v2", [
      { metric: { name: "evaporatedMass", value: 2.5, unit: "kg" }, measuredValue: 2, tolerance: 0.1 },
    ]);
    expect(report.overall).toBe("NOT_VALIDATED");
    expect(report.failedMetrics).toBe(1);
  });

  it("does not invent a validation result without evidence", () => {
    const report = validateModelRevision("PATCHOULI-OIL", "v3", []);
    expect(report.overall).toBe("INSUFFICIENT_DATA");
  });
});
