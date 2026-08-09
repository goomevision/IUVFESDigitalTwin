export type EvidenceSource = "MEASURED" | "SIMULATED" | "DERIVED" | "VALIDATED";

export type StudyEvidenceMetric = {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  source: EvidenceSource;
  provenanceId: string;
};

export type UnifiedResearchEvidenceInput = {
  studyId: string;
  title: string;
  revision: string;
  metrics: StudyEvidenceMetric[];
  simulationRunIds: string[];
  experimentIds: string[];
  validationReportIds: string[];
  engineeringDesignIds: string[];
  journalReportId?: string;
  reproducibilityPackageId?: string;
  warnings: string[];
  limitations: string[];
};

export type UnifiedResearchEvidenceReport = UnifiedResearchEvidenceInput & {
  status: "READY_FOR_REVIEW" | "INCOMPLETE";
  completeness: number;
  blockers: string[];
  sections: string[];
};

export function buildUnifiedResearchEvidenceReport(
  input: UnifiedResearchEvidenceInput,
): UnifiedResearchEvidenceReport {
  const blockers: string[] = [];
  if (!input.studyId) blockers.push("Missing study ID.");
  if (input.metrics.length === 0) blockers.push("No evidence metrics linked.");
  if (input.simulationRunIds.length === 0) blockers.push("No simulation runs linked.");
  if (input.experimentIds.length === 0) blockers.push("No experiment records linked.");
  if (input.validationReportIds.length === 0) blockers.push("No validation reports linked.");
  if (input.engineeringDesignIds.length === 0) blockers.push("No engineering design evidence linked.");
  if (input.limitations.length === 0) blockers.push("Study limitations are not documented.");

  const checks = [
    Boolean(input.studyId),
    input.metrics.length > 0,
    input.simulationRunIds.length > 0,
    input.experimentIds.length > 0,
    input.validationReportIds.length > 0,
    input.engineeringDesignIds.length > 0,
    input.limitations.length > 0,
  ];
  const completeness = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  return {
    ...input,
    status: blockers.length === 0 ? "READY_FOR_REVIEW" : "INCOMPLETE",
    completeness,
    blockers,
    sections: [
      "Study Identity",
      "Evidence Summary",
      "Measured vs Simulated vs Derived vs Validated",
      "Experimental Process",
      "Time-Resolved Simulation",
      "Thermodynamic and Phase Results",
      "Pressure and Vacuum Transients",
      "Mass and Energy Balance",
      "Uncertainty and Sensitivity",
      "Validation and Error Analysis",
      "Engineering Design and Drawing Traceability",
      "Warnings and Anomalies",
      "Limitations",
      "Scientific Interpretation",
      "Journal Evidence",
      "Reproducibility Evidence",
      "Provenance",
    ],
  };
}
