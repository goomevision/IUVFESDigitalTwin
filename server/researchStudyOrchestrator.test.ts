import { describe, expect, it } from "vitest";
import { buildResearchStudyRecord } from "./researchStudyOrchestrator";

describe("research study orchestrator", () => {
  const complete = {
    studyId: "STUDY-001",
    title: "Vacuum process study",
    researchQuestion: "How does controlled vacuum affect the process?",
    hypothesis: "Time-resolved control improves stability.",
    materialIds: ["MAT-001"],
    experimentIds: ["EXP-001"],
    sampleIds: ["SAMPLE-001"],
    instrumentIds: ["INST-001"],
    calibrationIds: ["CAL-001"],
    datasetIds: ["DATA-001"],
    simulationRunIds: ["SIM-001"],
    validationReportIds: ["VAL-001"],
    hardwareDesignIds: ["DESIGN-001"],
    modelVersions: ["MODEL-1"],
    equationIds: ["EQ-001"],
    parameterSetIds: ["PARAM-001"],
    anomalies: [],
    failedRuns: [],
    replicationRuns: ["EXP-002"],
    uncertaintySources: ["sensor uncertainty"],
    limitations: ["prototype validation pending"],
  };

  it("unifies journal, engineering and reproducibility readiness", () => {
    const result = buildResearchStudyRecord(complete);
    expect(result.status).toBe("READY_FOR_SCIENTIFIC_REVIEW");
    expect(result.completeness).toBe(100);
    expect(result.outputs.journalReportReady).toBe(true);
    expect(result.outputs.engineeringEvidenceReady).toBe(true);
    expect(result.outputs.reproducibilityPackageReady).toBe(true);
  });

  it("blocks incomplete evidence instead of silently filling gaps", () => {
    const result = buildResearchStudyRecord({
      ...complete,
      datasetIds: [],
      validationReportIds: [],
      uncertaintySources: [],
    });
    expect(result.status).toBe("EVIDENCE_INCOMPLETE");
    expect(result.completeness).toBeLessThan(100);
    expect(result.blockers.length).toBeGreaterThan(0);
  });
});
