import { describe, expect, it } from "vitest";
import { buildScientificValidationReport } from "./scientificReport";
import { buildScientificReportIntegrity, verifyScientificReportIntegrity } from "./scientificReportIntegrity";

describe("scientific report integrity", () => {
  const report = buildScientificValidationReport({
    researchExperimentId: "research-integrity",
    experimentId: "experiment-integrity",
    generatedAt: new Date("2026-08-09T00:00:00.000Z"),
    sections: [{
      key: "evidence",
      title: "Evidence-chain readiness",
      verdict: "PASS",
      summary: "Complete",
      evidence: { checks: { sensorObservations: true, simulationDataset: true, provenance: true } },
    }],
    provenance: {
      observationCount: 3,
      simulationResultPresent: true,
      provenanceRecordCount: 1,
      datasetIds: ["dataset-1"],
    },
  });

  it("produces a deterministic SHA-256 for the same report", () => {
    const first = buildScientificReportIntegrity(report);
    const second = buildScientificReportIntegrity(report);
    expect(first.sha256).toBe(second.sha256);
    expect(first.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("detects a changed report", () => {
    const integrity = buildScientificReportIntegrity(report);
    const changed = { ...report, overallVerdict: "INCONCLUSIVE" as const };
    expect(verifyScientificReportIntegrity(changed, integrity.sha256)).toBe(false);
  });
});
