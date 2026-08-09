import { describe, expect, it } from "vitest";
import { buildReproducibilityPackage } from "./reproducibilityPackage";

describe("reproducibility package", () => {
  const completeInput = {
    studyId: "STUDY-001",
    studyTitle: "IUVFES study",
    studyRevision: "A",
    rawDatasetIds: ["RAW-001"],
    processedDatasetIds: ["PROC-001"],
    protocolIds: ["PROT-001"],
    instrumentIds: ["INST-001"],
    calibrationIds: ["CAL-001"],
    modelVersionIds: ["MODEL-001"],
    equationIds: ["EQ-001"],
    parameterSetIds: ["PARAM-001"],
    simulationRunIds: ["SIM-001"],
    validationReportIds: ["VAL-001"],
    engineeringDesignIds: ["DESIGN-001"],
    journalReportId: "JOURNAL-001",
    softwareCommitIds: ["COMMIT-001"],
    provenanceManifestIds: ["PROV-001"],
  };

  it("marks a package complete when core evidence exists", () => {
    const result = buildReproducibilityPackage(completeInput);
    expect(result.status).toBe("COMPLETE");
    expect(result.missingEvidence).toHaveLength(0);
    expect(result.manifestSections).toContain("Instrument and Calibration Records");
    expect(result.manifestSections).toContain("Reproduction Instructions");
  });

  it("marks a package incomplete when evidence is missing", () => {
    const result = buildReproducibilityPackage({
      ...completeInput,
      calibrationIds: [],
      simulationRunIds: [],
    });
    expect(result.status).toBe("INCOMPLETE");
    expect(result.missingEvidence).toContain("Missing calibrationIds.");
    expect(result.missingEvidence).toContain("Missing simulationRunIds.");
  });
});
