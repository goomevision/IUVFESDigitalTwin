import type { ExperimentRecord, ExperimentRecommendation, MaterialGap } from "../../shared/scientific";
import type { EvidenceConflict, EvidenceProfile, NegativeEvidence, ScientificReportV2 } from "../../shared/scientific-v2";

/**
 * Builds the mandatory scientific report separation.
 * No layer is allowed to silently inherit another layer's epistemic status.
 */
export function buildScientificReport(input: {
  experimentId: string;
  verified: ExperimentRecord[];
  estimated: Array<{ statement: string; basis: string; confidence?: number }>;
  aiAnalysis: Array<{ statement: string; reasoning: string; confidence?: number }>;
  unknowns: MaterialGap[];
  nextExperiments: ExperimentRecommendation[];
  evidenceProfile?: EvidenceProfile;
  conflicts?: EvidenceConflict[];
  negativeEvidence?: NegativeEvidence[];
  lineage?: ScientificReportV2["lineage"];
  frequencySweeps?: ScientificReportV2["frequencySweeps"];
  aggregations?: ScientificReportV2["aggregations"];
}): ScientificReportV2 {
  return {
    experimentId: input.experimentId,
    verified: input.verified,
    estimated: input.estimated,
    aiAnalysis: input.aiAnalysis,
    unknowns: input.unknowns,
    nextExperiments: input.nextExperiments,
    evidenceProfile: input.evidenceProfile,
    conflicts: input.conflicts ?? [],
    negativeEvidence: input.negativeEvidence ?? [],
    lineage: input.lineage ?? [],
    frequencySweeps: input.frequencySweeps ?? [],
    aggregations: input.aggregations ?? [],
  };
}

export const SCIENTIFIC_REPORT_RULES = Object.freeze({
  requiredLayers: ["VERIFIED_OBSERVED", "ESTIMATED_MODEL", "AI_ANALYSIS"],
  requiredAdditionalSections: ["UNKNOWN_KNOWLEDGE_GAPS", "NEXT_EXPERIMENT"],
  resonanceRule: "OBSERVED_PEAK_MUST_NOT_BE_PROMOTED_TO_MOLECULAR_RESONANCE_WITHOUT_EVIDENCE",
  literatureFrequencyRule: "REPORTED_EXTRACTION_FREQUENCY_IS_NOT_F0",
  simulationRule: "SIMULATION_IS_NOT_LABORATORY_EVIDENCE",
  unknownRule: "UNKNOWN_MUST_REMAIN_UNKNOWN_UNTIL_SUPPORTED",
});
