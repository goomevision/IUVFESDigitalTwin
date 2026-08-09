export type ReproducibilityPackageInput = {
  studyId: string;
  studyTitle: string;
  studyRevision: string;
  rawDatasetIds: string[];
  processedDatasetIds: string[];
  protocolIds: string[];
  instrumentIds: string[];
  calibrationIds: string[];
  modelVersionIds: string[];
  equationIds: string[];
  parameterSetIds: string[];
  simulationRunIds: string[];
  validationReportIds: string[];
  engineeringDesignIds: string[];
  journalReportId?: string;
  softwareCommitIds: string[];
  provenanceManifestIds: string[];
};

export type ReproducibilityPackage = ReproducibilityPackageInput & {
  packageVersion: string;
  status: "COMPLETE" | "INCOMPLETE";
  missingEvidence: string[];
  manifestSections: string[];
};

export function buildReproducibilityPackage(input: ReproducibilityPackageInput): ReproducibilityPackage {
  const missingEvidence: string[] = [];
  const requiredArrays: Array<[string, string[]]> = [
    ["rawDatasetIds", input.rawDatasetIds],
    ["protocolIds", input.protocolIds],
    ["instrumentIds", input.instrumentIds],
    ["calibrationIds", input.calibrationIds],
    ["modelVersionIds", input.modelVersionIds],
    ["equationIds", input.equationIds],
    ["parameterSetIds", input.parameterSetIds],
    ["simulationRunIds", input.simulationRunIds],
    ["validationReportIds", input.validationReportIds],
    ["softwareCommitIds", input.softwareCommitIds],
    ["provenanceManifestIds", input.provenanceManifestIds],
  ];

  for (const [name, values] of requiredArrays) {
    if (values.length === 0) missingEvidence.push(`Missing ${name}.`);
  }

  if (!input.studyId) missingEvidence.push("Missing study ID.");
  if (!input.studyTitle) missingEvidence.push("Missing study title.");

  return {
    ...input,
    packageVersion: "1.0",
    status: missingEvidence.length === 0 ? "COMPLETE" : "INCOMPLETE",
    missingEvidence,
    manifestSections: [
      "Study Identity",
      "Research Metadata",
      "Raw Data References",
      "Processed Data References",
      "Experimental Protocols",
      "Instrument and Calibration Records",
      "Digital Twin Model Versions",
      "Governing Equations",
      "Parameter Sets",
      "Simulation Runs",
      "Validation Reports",
      "Engineering Design Revisions",
      "Scientific Journal Report",
      "Software Commit References",
      "Provenance Manifest",
      "Reproduction Instructions",
      "Known Limitations",
    ],
  };
}
