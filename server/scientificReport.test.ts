import { describe, expect, it } from "vitest";
import { buildScientificValidationReport } from "./scientificReport";

describe("scientific validation report", () => {
  const provenance = {
    observationCount: 10,
    simulationResultPresent: true,
    provenanceRecordCount: 3,
    datasetIds: ["dataset-1"],
  };

  it("is ready only when all required evidence is present and sections pass", () => {
    const report = buildScientificValidationReport({
      researchExperimentId: "research-1",
      experimentId: "experiment-1",
      generatedAt: new Date("2026-08-09T00:00:00.000Z"),
      sections: [{ key: "comparison", title: "Simulation comparison", verdict: "PASS", summary: "Within declared criteria", evidence: { rmse: 0.1 } }],
      provenance,
    });

    expect(report.overallVerdict).toBe("PASS");
    expect(report.readiness).toBe("READY");
    expect(report.schemaVersion).toBe("1.0.0");
  });

  it("can derive evidence presence from the readiness section", () => {
    const report = buildScientificValidationReport({
      researchExperimentId: "research-evidence",
      experimentId: "experiment-evidence",
      sections: [{
        key: "evidence",
        title: "Evidence-chain readiness",
        verdict: "PASS",
        summary: "Evidence chain complete",
        evidence: { checks: { sensorObservations: true, simulationDataset: true, provenance: true } },
      }],
      provenance: {},
    });

    expect(report.readiness).toBe("READY");
  });

  it("propagates a failed section to the overall report", () => {
    const report = buildScientificValidationReport({
      researchExperimentId: "research-2",
      experimentId: "experiment-2",
      sections: [
        { key: "mass", title: "Mass balance", verdict: "PASS", summary: "Closed", evidence: {} },
        { key: "energy", title: "Energy balance", verdict: "FAIL", summary: "Outside tolerance", evidence: { closurePercent: 4.2 } },
      ],
      provenance,
    });

    expect(report.overallVerdict).toBe("FAIL");
    expect(report.readiness).toBe("NOT_READY");
  });

  it("does not promote inconclusive evidence to PASS", () => {
    const report = buildScientificValidationReport({
      researchExperimentId: "research-3",
      experimentId: "experiment-3",
      sections: [{ key: "energy", title: "Energy balance", verdict: "INCONCLUSIVE", summary: "No acceptance tolerance", evidence: {} }],
      provenance,
    });

    expect(report.overallVerdict).toBe("INCONCLUSIVE");
    expect(report.readiness).toBe("NOT_READY");
  });
});
