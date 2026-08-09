import { describe, expect, it } from "vitest";
import { estimateUncertainty, summarizeReplicates, validateAgainstReplicates } from "./uncertaintyEngine";

describe("uncertaintyEngine", () => {
  it("summarizes replicate measurements", () => {
    const result = summarizeReplicates([10, 12, 11]);
    expect(result.count).toBe(3);
    expect(result.mean).toBe(11);
    expect(result.standardDeviation).toBe(1);
    expect(result.standardError).toBeCloseTo(1 / Math.sqrt(3));
  });

  it("combines repeatability and instrument uncertainty", () => {
    const result = estimateUncertainty({ values: [10, 12, 11], instrumentStandardUncertainty: 0.5, confidenceMultiplier: 2 });
    expect(result.interpretation).toBe("ESTIMATED");
    expect(result.combinedStandardUncertainty).toBeCloseTo(Math.sqrt(1 / 3 + 0.25));
    expect(result.expandedUncertainty).toBeCloseTo(2 * Math.sqrt(1 / 3 + 0.25));
    expect(result.intervalLow).toBeLessThan(11);
    expect(result.intervalHigh).toBeGreaterThan(11);
  });

  it("refuses uncertainty interpretation with one replicate", () => {
    const result = estimateUncertainty({ values: [10] });
    expect(result.interpretation).toBe("INSUFFICIENT_DATA");
    expect(result.expandedUncertainty).toBeNaN();
  });

  it("keeps rejected/non-finite values out of replicate statistics", () => {
    const result = summarizeReplicates([10, Number.NaN, 12, Number.POSITIVE_INFINITY]);
    expect(result.count).toBe(2);
    expect(result.mean).toBe(11);
  });

  it("uses an explicit tolerance for PASS/FAIL and remains conservative without it", () => {
    const pass = validateAgainstReplicates({ experimentalValues: [10, 10.2, 9.8], simulationValue: 10.05, tolerance: 0.2 });
    const fail = validateAgainstReplicates({ experimentalValues: [10, 10.2, 9.8], simulationValue: 10.5, tolerance: 0.2 });
    const inconclusive = validateAgainstReplicates({ experimentalValues: [10, 10.2], simulationValue: 10.05 });
    expect(pass.verdict).toBe("PASS");
    expect(fail.verdict).toBe("FAIL");
    expect(inconclusive.verdict).toBe("INCONCLUSIVE");
  });
});
