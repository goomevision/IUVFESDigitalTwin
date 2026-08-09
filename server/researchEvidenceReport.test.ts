import { describe, expect, it } from "vitest";
import { buildUnifiedResearchEvidenceReport } from "./researchEvidenceReport";

describe("unified research evidence report", () => {
  it("builds a review-ready report from linked evidence", () => {
    const result = buildUnifiedResearchEvidenceReport({
      studyId: "STUDY-001",
      title: "IUVFES study",
      revision: "A",
      metrics: [
        { id: "M1", name: "max pressure", value: 20, unit: "kPa", source: "SIMULATED", provenanceId: "SIM-001" },
        { id: "M2", name: "measured temperature", value: 320, unit: "K", source: "MEASURED", provenanceId: "EXP-001" },
      ],
      simulationRunIds: ["SIM-001"],
      experimentIds: ["EXP-001"],
      validationReportIds: ["VAL-001"],
      engineeringDesignIds: ["DESIGN-001"],
      journalReportId: "JOURNAL-001",
      reproducibilityPackageId: "REPRO-001",
      warnings: [],
      limitations: ["Prototype validation pending"],
    });

    expect(result.status).toBe("READY_FOR_REVIEW");
    expect(result.completeness).toBe(100);
    expect(result.sections).toContain("Measured vs Simulated vs Derived vs Validated");
    expect(result.sections).toContain("Engineering Design and Drawing Traceability");
  });

  it("blocks incomplete evidence", () => {
    const result = buildUnifiedResearchEvidenceReport({
      studyId: "STUDY-002",
      title: "Incomplete",
      revision: "A",
      metrics: [],
      simulationRunIds: [],
      experimentIds: [],
      validationReportIds: [],
      engineeringDesignIds: [],
      warnings: [],
      limitations: [],
    });

    expect(result.status).toBe("INCOMPLETE");
    expect(result.completeness).toBeLessThan(100);
    expect(result.blockers.length).toBeGreaterThan(0);
  });
});
