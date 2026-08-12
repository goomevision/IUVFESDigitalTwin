/**
 * IUVFES report contract: every result is presented in three non-mixing layers.
 * 1) VERIFIED/OBSERVED evidence: measured or independently sourced evidence.
 * 2) ESTIMATE/HYPOTHESIS: model assumptions and unvalidated possibilities.
 * 3) AI ANALYSIS: explicit reasoning and recommended next experiments.
 */

export type ReportLayer = "EVIDENCE" | "ESTIMATE" | "AI_ANALYSIS";
export type ClaimStatus = "OBSERVED" | "REPLICATED" | "SUPPORTED" | "CONTRADICTED" | "HYPOTHESIS" | "MODEL_FIT" | "UNKNOWN";

export interface ScientificClaim {
  id: string;
  layer: ReportLayer;
  statement: string;
  status: ClaimStatus;
  confidence?: number;
  sourceIds: string[];
  conditions?: Record<string, unknown>;
}

export interface LabActionRecommendation {
  id: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  purpose: "REPLICATION" | "VALIDATION" | "FALSIFICATION" | "CALIBRATION" | "PARAMETER_SWEEP" | "SAMPLE_COMPARISON";
  question: string;
  proposedConditions: Record<string, unknown>;
  expectedInformationGain: number;
  preventsDuplicateTesting: boolean;
  dependsOn: string[];
}

export interface ScientificReport {
  version: "IUVFES-3L-1";
  experimentId: string;
  generatedAt: string;
  evidence: ScientificClaim[];
  estimates: ScientificClaim[];
  aiAnalysis: ScientificClaim[];
  labRecommendations: LabActionRecommendation[];
  unresolvedGaps: string[];
  conflicts: string[];
}

export function buildThreeLayerReport(args: {
  experimentId: string;
  evidence: ScientificClaim[];
  estimates: ScientificClaim[];
  aiAnalysis: ScientificClaim[];
  labRecommendations: LabActionRecommendation[];
  unresolvedGaps?: string[];
  conflicts?: string[];
}): ScientificReport {
  const rejectWrongLayer = (claims: ScientificClaim[], expected: ReportLayer) => {
    for (const claim of claims) {
      if (claim.layer !== expected) throw new Error(`Claim ${claim.id} is assigned to ${claim.layer}, expected ${expected}`);
      if (claim.layer === "EVIDENCE" && ["HYPOTHESIS", "MODEL_FIT"].includes(claim.status)) {
        throw new Error(`Unvalidated claim ${claim.id} cannot enter EVIDENCE layer`);
      }
      if (claim.layer === "ESTIMATE" && ["OBSERVED", "REPLICATED", "SUPPORTED"].includes(claim.status)) {
        throw new Error(`Validated claim ${claim.id} cannot be represented as ESTIMATE`);
      }
    }
  };

  rejectWrongLayer(args.evidence, "EVIDENCE");
  rejectWrongLayer(args.estimates, "ESTIMATE");
  rejectWrongLayer(args.aiAnalysis, "AI_ANALYSIS");

  return {
    version: "IUVFES-3L-1",
    experimentId: args.experimentId,
    generatedAt: new Date().toISOString(),
    evidence: args.evidence.map(cloneClaim),
    estimates: args.estimates.map(cloneClaim),
    aiAnalysis: args.aiAnalysis.map(cloneClaim),
    labRecommendations: args.labRecommendations.map(r => ({ ...r, proposedConditions: { ...r.proposedConditions }, dependsOn: [...r.dependsOn] })),
    unresolvedGaps: [...(args.unresolvedGaps ?? [])],
    conflicts: [...(args.conflicts ?? [])],
  };
}

function cloneClaim(claim: ScientificClaim): ScientificClaim {
  return { ...claim, sourceIds: [...claim.sourceIds], conditions: claim.conditions ? { ...claim.conditions } : undefined };
}

export function rankLabActions(actions: LabActionRecommendation[]): LabActionRecommendation[] {
  return [...actions].sort((a, b) => b.expectedInformationGain - a.expectedInformationGain || priorityWeight(a.priority) - priorityWeight(b.priority));
}

function priorityWeight(priority: LabActionRecommendation["priority"]): number {
  return priority === "HIGH" ? 0 : priority === "MEDIUM" ? 1 : 2;
}
