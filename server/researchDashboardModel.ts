import { UnifiedResearchEvidenceReport } from "./researchEvidenceReport";

export type ResearchDashboardModel = {
  studyId: string;
  title: string;
  revision: string;
  status: UnifiedResearchEvidenceReport["status"];
  completeness: number;
  headlineMetrics: UnifiedResearchEvidenceReport["metrics"];
  provenanceCoverage: number;
  timeline: Array<{ id: string; kind: "EXPERIMENT" | "SIMULATION" | "VALIDATION" | "DESIGN" | "JOURNAL"; label: string }>;
  warnings: string[];
  blockers: string[];
  sections: UnifiedResearchEvidenceReport["sections"];
};

export function buildResearchDashboard(report: UnifiedResearchEvidenceReport): ResearchDashboardModel {
  const provenanceCount = report.metrics.filter((metric) => Boolean(metric.provenanceId)).length;
  const provenanceCoverage = report.metrics.length === 0
    ? 0
    : Math.round((provenanceCount / report.metrics.length) * 100);

  const timeline = [
    ...report.experimentIds.map((id) => ({ id, kind: "EXPERIMENT" as const, label: `Experiment ${id}` })),
    ...report.simulationRunIds.map((id) => ({ id, kind: "SIMULATION" as const, label: `Simulation ${id}` })),
    ...report.validationReportIds.map((id) => ({ id, kind: "VALIDATION" as const, label: `Validation ${id}` })),
    ...report.engineeringDesignIds.map((id) => ({ id, kind: "DESIGN" as const, label: `Engineering Design ${id}` })),
    ...(report.journalReportId ? [{ id: report.journalReportId, kind: "JOURNAL" as const, label: `Journal ${report.journalReportId}` }] : []),
  ];

  return {
    studyId: report.studyId,
    title: report.title,
    revision: report.revision,
    status: report.status,
    completeness: report.completeness,
    headlineMetrics: report.metrics,
    provenanceCoverage,
    timeline,
    warnings: report.warnings,
    blockers: report.blockers,
    sections: report.sections,
  };
}
