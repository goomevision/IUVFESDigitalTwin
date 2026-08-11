import type {
  ExperimentPurpose,
  ExperimentRecommendation,
  ExperimentRecord,
  FrequencySweep,
  MaterialGap,
  SampleIdentity,
  VariableControl,
} from "./scientific";

/** Additive scientific layer for evidence accumulation and human-AI-lab learning. */
export type Comparability = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
export type ExperimentMatch = "EXACT" | "NEAR" | "NOVEL";
export type RepeatReason =
  | "EVIDENCE_ALREADY_STRONG"
  | "INDEPENDENT_REPLICATION"
  | "CALIBRATION"
  | "CONFLICT_RESOLUTION"
  | "NEW_VARIABLE"
  | "NEW_SAMPLE_CONTEXT"
  | "AUDIT_REPRODUCIBILITY";

export interface EvidenceProfile {
  measurementQuality: number;
  replicationStrength: number;
  independence: number;
  calibrationStatus: number;
  sampleComparability: number;
  literatureAgreement: number;
  modelAgreement: number;
  uncertaintyQuality: number;
  overall?: number;
  basis: string[];
}

export interface SampleLineage {
  lineageId: string;
  materialId: string;
  sourceSampleId?: string;
  parentSampleId?: string;
  childSampleId?: string;
  transformation: string;
  transformationParameters?: Record<string, string | number | boolean>;
  createdAt: string;
}

export interface ExperimentSignature {
  materialId: string;
  sampleId: string;
  protocolId?: string;
  instrumentId?: string;
  laboratoryId?: string;
  controlledVariables: VariableControl[];
  experimentalVariables: VariableControl[];
  frequency_kHz?: number;
  power_W?: number;
  amplitudePercent?: number;
  timeMin?: number;
  temperature_C?: number;
  pressure_mbar?: number;
  solventType?: string;
  solventRatio?: string;
  sampleState?: SampleIdentity["sampleState"];
}

export interface ExperimentMatchResult {
  match: ExperimentMatch;
  similarity: number;
  reasons: string[];
  priorExperimentIds: string[];
  repeatReason?: RepeatReason;
}

export interface EvidenceConflict {
  conflictId: string;
  subjectKey: string;
  experimentIds: string[];
  conflictingParameters: string[];
  possibleExplanations: string[];
  status: "OPEN" | "INVESTIGATING" | "RESOLVED";
  createdAt: string;
}

export interface NegativeEvidence {
  evidenceId: string;
  experimentId: string;
  statement: string;
  conditions: Record<string, string | number | boolean>;
  effectSize?: number;
  detectionLimit?: number;
  significance?: number;
  createdAt: string;
}

export interface HypothesisRecord {
  hypothesisId: string;
  materialId: string;
  statement: string;
  supportingTests: string[];
  falsificationTests: string[];
  status:
    | "UNKNOWN"
    | "HYPOTHESIS"
    | "MODEL"
    | "OBSERVED"
    | "REPLICATED"
    | "SUPPORTED"
    | "VALIDATED"
    | "CONTRADICTED"
    | "REVISED";
  evidenceIds: string[];
  updatedAt: string;
}

export interface AIDecisionLedgerEntry {
  recommendationId: string;
  modelVersion: string;
  evidenceIds: string[];
  reason: string;
  predictedOutcome?: string;
  actualOutcome?: string;
  predictionError?: number;
  informationGain?: number;
  modelUpdated: boolean;
  acceptedAt: string;
  completedAt?: string;
}

export interface KnowledgeAggregation {
  subjectKey: string;
  evidenceCount: number;
  independentLabCount: number;
  independentDatasetCount: number;
  replicatedCount: number;
  contradictionCount: number;
  comparability: Comparability;
  evidenceProfile: EvidenceProfile;
  mean?: number;
  standardDeviation?: number;
  coefficientOfVariation?: number;
  confidenceInterval95?: [number, number];
  lastUpdated: string;
}

export interface ScientificReportV2 {
  experimentId: string;
  verified: ExperimentRecord[];
  estimated: Array<{ statement: string; basis: string; confidence?: number }>;
  aiAnalysis: Array<{ statement: string; reasoning: string; confidence?: number }>;
  unknowns: MaterialGap[];
  nextExperiments: ExperimentRecommendation[];
  evidenceProfile?: EvidenceProfile;
  conflicts: EvidenceConflict[];
  negativeEvidence: NegativeEvidence[];
  lineage: SampleLineage[];
  frequencySweeps: FrequencySweep[];
  aggregations: KnowledgeAggregation[];
}

export interface ExperimentPlanningContext {
  materialId: string;
  sampleId: string;
  purpose: ExperimentPurpose;
  hypothesisId?: string;
  knowledgeGaps: MaterialGap[];
  priorExperiments: ExperimentRecord[];
  availableSweeps: FrequencySweep[];
  constraints: Record<string, string | number | boolean>;
}
