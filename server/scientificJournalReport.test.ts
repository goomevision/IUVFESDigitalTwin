import { describe, expect, it } from "vitest";
import { buildScientificJournalReport } from "./scientificJournalReport";

describe("scientific journal evidence report", () => {
  it("builds a complete evidence structure when all core evidence exists", () => {
    const report = buildScientificJournalReport({
      studyId: "STUDY-001",
      title: "IUVFES study",
      researchQuestion: "How does the process respond to controlled vacuum and heating?",
      hypothesis: "Time-resolved control improves process stability.",
      materialIds: ["MAT-001"],
      experimentIds: ["EXP-001"],
      datasetIds: ["DATA-001"],
      simulationRunIds: ["SIM-001"],
      validationReportIds: ["VAL-001"],
      hardwareDesignId: "DESIGN-001",
      modelVersions: ["MODEL-1"],
      equationIds: ["EQ-001"],
      parameterSetIds: ["PARAM-001"],
      keyResults: { maxPressureKPa: 20 },
      uncertaintySources: ["sensor uncertainty"],
      limitations: ["prototype not yet physically validated"],
      anomalies: [],
      failedRuns: [],
      replicationRuns: ["EXP-002"],
    });

    expect(report.evidenceCompleteness).toBe("COMPLETE");
    expect(report.sections).toContain("Time-Resolved Process Results");
    expect(report.sections).toContain("Mass and Energy Balance");
    expect(report.sections).toContain("Vacuum and Pressure Transients");
    expect(report.sections).toContain("Hardware/Engineering Design Analysis");
    expect(report.sections).toContain("Data/Code/Model Provenance");
  });

  it("blocks a report that lacks core evidence", () => {
    const report = buildScientificJournalReport({
      studyId: "STUDY-002",
      title: "Incomplete study",
      researchQuestion: "Q",
      hypothesis: "H",
      materialIds: [],
      experimentIds: [],
      datasetIds: [],
      simulationRunIds: [],
      validationReportIds: [],
      modelVersions: [],
      equationIds: [],
      parameterSetIds: [],
      keyResults: {},
      uncertaintySources: [],
      limitations: [],
      anomalies: [],
      failedRuns: [],
      replicationRuns: [],
    });

    expect(report.evidenceCompleteness).toBe("INCOMPLETE");
    expect(report.blockers.length).toBeGreaterThan(0);
  });
});
