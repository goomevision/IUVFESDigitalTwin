export type ReportVerdict = "PASS" | "FAIL" | "INCONCLUSIVE";

export interface ReportSection {
  key: string;
  title: string;
  verdict: ReportVerdict;
  summary: string;
  evidence: unknown;
}

export interface ScientificValidationReportInput {
  researchExperimentId: string;
  experimentId: string;
  generatedAt?: Date;
  sections: ReportSection[];
  provenance: {
    datasetIds?: string[];
    observationCount?: number;
    simulationResultPresent?: boolean;
    provenanceRecordCount?: number;
  };
}

export interface ScientificValidationReport {
  schemaVersion: "1.0.0";
  reportId: string;
  researchExperimentId: string;
  experimentId: string;
  generatedAt: string;
  overallVerdict: ReportVerdict;
  readiness: "READY" | "NOT_READY";
  sections: ReportSection[];
  provenance: ScientificValidationReportInput["provenance"];
  scientificBoundary: string;
}

function deriveOverallVerdict(sections: ReportSection[]): ReportVerdict {
  if (sections.length === 0) return "INCONCLUSIVE";
  if (sections.some(section => section.verdict === "FAIL")) return "FAIL";
  if (sections.some(section => section.verdict === "INCONCLUSIVE")) return "INCONCLUSIVE";
  return "PASS";
}

function deriveReadiness(reportVerdict: ReportVerdict, provenance: ScientificValidationReportInput["provenance"], sections: ReportSection[]): "READY" | "NOT_READY" {
  const evidenceSection = sections.find(section => section.key === "evidence");
  const evidence = evidenceSection?.evidence as { checks?: Record<string, unknown> } | undefined;
  const hasExperimentEvidence = (provenance.observationCount ?? 0) > 0 || evidence?.checks?.sensorObservations === true;
  const hasSimulationEvidence = provenance.simulationResultPresent === true || evidence?.checks?.simulationDataset === true;
  const hasProvenance = (provenance.provenanceRecordCount ?? 0) > 0 || evidence?.checks?.provenance === true;

  // Readiness is stricter than evidence presence: only a fully passing report can be READY.
  return reportVerdict === "PASS" && hasExperimentEvidence && hasSimulationEvidence && hasProvenance ? "READY" : "NOT_READY";
}

export function buildScientificValidationReport(input: ScientificValidationReportInput): ScientificValidationReport {
  const generatedAt = (input.generatedAt ?? new Date()).toISOString();
  const overallVerdict = deriveOverallVerdict(input.sections);
  const reportId = `IUVFES-REPORT-${input.researchExperimentId}-${generatedAt.replace(/[-:.TZ]/g, "")}`;

  return {
    schemaVersion: "1.0.0",
    reportId,
    researchExperimentId: input.researchExperimentId,
    experimentId: input.experimentId,
    generatedAt,
    overallVerdict,
    readiness: deriveReadiness(overallVerdict, input.provenance, input.sections),
    sections: input.sections,
    provenance: input.provenance,
    scientificBoundary: "This report organizes supplied evidence and validation metrics. It does not establish scientific truth, instrument accuracy, causality, or physical-model validity beyond the declared evidence and acceptance criteria.",
  };
}
