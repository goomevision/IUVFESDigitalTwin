export type JournalEvidenceInput = {
  studyId: string;
  title: string;
  researchQuestion: string;
  hypothesis: string;
  materialIds: string[];
  experimentIds: string[];
  datasetIds: string[];
  simulationRunIds: string[];
  validationReportIds: string[];
  hardwareDesignId?: string;
  modelVersions: string[];
  equationIds: string[];
  parameterSetIds: string[];
  keyResults: Record<string, number | string>;
  uncertaintySources: string[];
  limitations: string[];
  anomalies: string[];
  failedRuns: string[];
  replicationRuns: string[];
};

export type ScientificJournalReport = JournalEvidenceInput & {
  reportVersion: string;
  sections: string[];
  evidenceCompleteness: "COMPLETE" | "INCOMPLETE";
  blockers: string[];
  claimsAllowed: string[];
};

export function buildScientificJournalReport(input: JournalEvidenceInput): ScientificJournalReport {
  const blockers: string[] = [];
  if (!input.studyId) blockers.push("Missing study ID.");
  if (input.materialIds.length === 0) blockers.push("No material evidence linked.");
  if (input.experimentIds.length === 0) blockers.push("No experiment records linked.");
  if (input.datasetIds.length === 0) blockers.push("No datasets linked.");
  if (input.simulationRunIds.length === 0) blockers.push("No simulation runs linked.");
  if (input.validationReportIds.length === 0) blockers.push("No validation reports linked.");
  if (input.modelVersions.length === 0) blockers.push("No model versions linked.");
  if (input.equationIds.length === 0) blockers.push("No governing equations linked.");
  if (input.uncertaintySources.length === 0) blockers.push("Uncertainty sources have not been documented.");
  if (input.limitations.length === 0) blockers.push("Study limitations have not been documented.");

  return {
    ...input,
    reportVersion: "1.0",
    sections: [
      "Title",
      "Abstract",
      "Research Question and Hypothesis",
      "Materials and Hardware Configuration",
      "Experimental Protocol",
      "Simulation Model and Governing Equations",
      "Numerical Parameters and Initial Conditions",
      "Time-Resolved Process Results",
      "Thermodynamic and Phase-Change Results",
      "Mass and Energy Balance",
      "Vacuum and Pressure Transients",
      "Hardware/Engineering Design Analysis",
      "Experimental vs Digital Twin Comparison",
      "Uncertainty and Sensitivity Analysis",
      "Anomalies and Failed Runs",
      "Validation and Reproducibility",
      "Limitations",
      "Discussion",
      "Conclusions",
      "Data/Code/Model Provenance",
      "References and Supplementary Evidence",
    ],
    evidenceCompleteness: blockers.length === 0 ? "COMPLETE" : "INCOMPLETE",
    blockers,
    claimsAllowed: [
      "Report measured, simulated, and validated results separately.",
      "Trace every quantitative claim to a dataset, experiment, simulation run, equation/model version, or validation report.",
      "Label AI-generated interpretation as interpretation or hypothesis unless independently supported by evidence.",
      "Do not claim causality, instrument accuracy, safety, or physical validity beyond the available evidence.",
    ],
  };
}
