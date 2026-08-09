import { describe, expect, it } from "vitest";
import { buildResearchDashboard } from "./researchDashboardModel";

describe("research dashboard model", () => {
  it("aggregates study evidence into timeline and provenance coverage", () => {
    const dashboard = buildResearchDashboard({
      studyId: "STUDY-001",
      title: "IUVFES study",
      revision: "A",
      metrics: [
        { id: "M1", name: "pressure", value: 20, unit: "kPa", source: "SIMULATED", provenanceId: "SIM-001" },
        { id: "M2", name: "temperature", value: 320, unit: "K", source: "MEASURED", provenanceId: "EXP-001" },
      ],
      simulationRunIds: ["SIM-001"],
      experimentIds: ["EXP-001"],
      validationReportIds: ["VAL-001"],
      engineeringDesignIds: ["DESIGN-001"],
      journalReportId: "JOURNAL-001",
      reproducibilityPackageId: "REPRO-001",
      warnings: [],
      limitations: ["Prototype validation pending"],
      status: "READY_FOR_REVIEW",
      completeness: 100,
      blockers: [],
      sections: ["Evidence Summary"],
    });

    expect(dashboard.provenanceCoverage).toBe(100);
    expect(dashboard.timeline.map((item) => item.kind)).toEqual([
      "EXPERIMENT",
      "SIMULATION",
      "VALIDATION",
      "DESIGN",
      "JOURNAL",
    ]);
    expect(dashboard.completeness).toBe(100);
  });
});
