import { describe, expect, it } from "vitest";
import { assessReplication, calculateEvidenceScore, compareMeasurements, type LabMeasurement, type SimulationMeasurement } from "./scientificEvidenceEngine";

describe("scientific evidence engine", () => {
  const lab: LabMeasurement = {
    measurementId: "lab-1", experimentId: "exp-1", materialId: "mat-1", sampleId: "sample-1", origin: "LABORATORY",
    parameter: "oilRecoveredKg", measuredValue: 10.1, unit: "kg", uncertainty: 0.2, provenanceId: "prov-1", observedAt: "2026-08-12T00:00:00.000Z",
  };
  const sim: SimulationMeasurement = {
    measurementId: "sim-1", experimentId: "exp-1", materialId: "mat-1", sampleId: "sample-1", origin: "SIMULATION",
    parameter: "oilRecoveredKg", modelledValue: 10, unit: "kg", modelVersion: "model-v1", simulationRunId: "run-1", observedAt: "2026-08-12T00:00:00.000Z",
  };

  it("keeps measured and modelled values distinct and derives comparison", () => {
    const result = compareMeasurements(lab, sim, 0.05);
    expect(result.measuredValue).toBe(10.1);
    expect(result.modelledValue).toBe(10);
    expect(result.origin).toBe("DERIVED");
    expect(result.disposition).toBe("SUPPORTED");
  });

  it("rejects cross-sample comparisons", () => {
    expect(() => compareMeasurements(lab, { ...sim, sampleId: "sample-2" })).toThrow(/same material\/sample/);
  });

  it("detects mixed evidence as conflict", () => {
    const supported = compareMeasurements(lab, sim);
    const contradicted = compareMeasurements({ ...lab, measurementId: "lab-2", measuredValue: 15 }, sim);
    const assessment = assessReplication([supported, contradicted], ["lab-A", "lab-B"]);
    expect(assessment.disposition).toBe("CONFLICT");
  });

  it("calculates bounded evidence score", () => {
    const score = calculateEvidenceScore({ measurementQuality: 1, replicationStrength: 0.8, independence: 0.5, calibrationStatus: 1, sampleComparability: 1, uncertaintyQuality: 0.75 });
    expect(score.overall).toBeGreaterThan(0);
    expect(score.overall).toBeLessThanOrEqual(1);
  });
});
