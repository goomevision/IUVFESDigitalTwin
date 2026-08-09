import { createHash } from "node:crypto";
import type { ScientificValidationReport } from "./scientificReport";

export interface ScientificReportIntegrity {
  canonicalPayload: string;
  sha256: string;
}

/**
 * Produce a deterministic integrity hash for a scientific validation report.
 * The hash covers the report content but deliberately excludes the hash itself.
 */
export function buildScientificReportIntegrity(report: ScientificValidationReport): ScientificReportIntegrity {
  const canonicalPayload = JSON.stringify({
    schemaVersion: report.schemaVersion,
    reportId: report.reportId,
    researchExperimentId: report.researchExperimentId,
    experimentId: report.experimentId,
    generatedAt: report.generatedAt,
    overallVerdict: report.overallVerdict,
    readiness: report.readiness,
    sections: report.sections,
    provenance: report.provenance,
    scientificBoundary: report.scientificBoundary,
  });

  return {
    canonicalPayload,
    sha256: createHash("sha256").update(canonicalPayload, "utf8").digest("hex"),
  };
}

export function verifyScientificReportIntegrity(
  report: ScientificValidationReport,
  expectedSha256: string,
): boolean {
  return buildScientificReportIntegrity(report).sha256 === expectedSha256;
}
