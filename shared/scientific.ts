/**
 * IUVFES Scientific Data Contract v1.
 *
 * This file deliberately models uncertainty and provenance explicitly.
 * UNKNOWN is a valid scientific state; missing values must never be inferred silently.
 */

export type KnowledgeClassification =
  | "OBSERVED"
  | "DERIVED"
  | "HYPOTHESIS"
  | "MODEL_FIT"
  | "VALIDATED";

export type EvidenceLevel =
  | "LITERATURE"
  | "LABORATORY"
  | "SIMULATION"
  | "MULTI_SOURCE";

export type ValidationStatus =
  | "UNKNOWN"
  | "UNTESTED"
  | "SUPPORTED"
  | "CONTRADICTED";

export type ExperimentPurpose =
  | "EXPLORATION"
  | "REPLICATION"
  | "VALIDATION"
  | "FALSIFICATION"
  | "CALIBRATION"
  | "COMPARISON"
  | "PARAMETER_SWEEP"
  | "MODEL_TEST";

export type SampleState =
  | "FRESH"
  | "WET"
  | "DRIED"
  | "FROZEN"
  | "FREEZE_DIED"
  | "THAWED"
  | "POWDER"
  | "OTHER"
  | "UNKNOWN";

export type KnowledgeSource =
  | "LITERATURE"
  | "LABORATORY"
  | "SIMULATION"
  | "DERIVED"
  | "HYPOTHESIS";

export type EvidenceQuality =
  | "RAW"
  | "SCREENING"
  | "VALIDATED"
  | "REPLICATED"
  | "REVIEWED"
  | "PUBLISHED"
  | "CONFLICTED";

export type UnknownReason =
  | "NO_DATA"
  | "NOT_MEASURED"
  | "INSUFFICIENT_SWEEP"
  | "CONFLICTING_EVIDENCE"
  | "SOURCE_UNAVAILABLE"
  | "NOT_APPLICABLE"
  | "UNKNOWN";

export interface UnknownValue {
  state: "UNKNOWN";
  reason: UnknownReason;
  note?: string;
}

export type KnownOrUnknown<T> = T | UnknownValue;

export interface GeographicContext {
  country?: string;
  province?: string;
  district?: string;
  locality?: string;
  latitude?: number;
  longitude?: number;
  altitude_m?: KnownOrUnknown<number>;
  soilType?: string;
}

export interface CultivationContext {
  system?: "WILD" | "FARM" | "GREENHOUSE" | "LAB" | "UNKNOWN";
  fertilizer?: string;
  pesticide?: string;
  irrigation?: string;
  cultivationNotes?: string;
}

export interface BiologicalContext {
  cultivar?: string;
  plantAgeDays?: KnownOrUnknown<number>;
  growthStage?: string;
  harvestDate?: string;
  harvestTime?: string;
  season?: string;
  diseaseOrStress?: string;
}

export interface PostHarvestContext {
  washing?: string;
  dryingMethod?: string;
  dryingTemperature_C?: KnownOrUnknown<number>;
  dryingDuration_h?: KnownOrUnknown<number>;
  freezingTemperature_C?: KnownOrUnknown<number>;
  storageTemperature_C?: KnownOrUnknown<number>;
  storageDuration_days?: KnownOrUnknown<number>;
  thawingMethod?: string;
}

export interface PreparationContext {
  cuttingMethod?: string;
  grindingMethod?: string;
  particleSize_mm?: KnownOrUnknown<number>;
  sieveMesh?: string;
  homogenization?: string;
}

export interface SampleIdentity {
  sampleId: string;
  materialId: string;
  scientificName: string;
  commonName?: string;
  plantPart: string;
  subPart?: string;
  batchId?: string;
  sampleState: SampleState;
  moisturePercent?: KnownOrUnknown<number>;
  massKg?: KnownOrUnknown<number>;
  geographic: GeographicContext;
  cultivation: CultivationContext;
  biological: BiologicalContext;
  postHarvest: PostHarvestContext;
  preparation: PreparationContext;
  notes?: string;
}

export interface VariableControl {
  name: string;
  role: "CONTROLLED" | "VARIABLE" | "OBSERVED" | "COVARIATE";
  value?: number | string | boolean;
  unit?: string;
}

export interface ExtractionProtocol {
  protocolId: string;
  solventType?: string;
  solventRatio?: string;
  frequency_kHz?: KnownOrUnknown<number>;
  power_W?: KnownOrUnknown<number>;
  amplitudePercent?: KnownOrUnknown<number>;
  intensity_Wcm2?: KnownOrUnknown<number>;
  dutyCyclePercent?: KnownOrUnknown<number>;
  timeMin?: KnownOrUnknown<number>;
  temperature_C?: KnownOrUnknown<number>;
  pressure_mbar?: KnownOrUnknown<number>;
  particleSize_mm?: KnownOrUnknown<number>;
  variables?: VariableControl[];
}

export interface Provenance {
  provenanceId: string;
  sourceType: KnowledgeSource;
  citation?: string;
  instrumentId?: string;
  operatorId?: string;
  datasetId?: string;
  originalFileHash?: string;
  importMethod: "MANUAL" | "API" | "BULK_CSV" | "REAL_TIME";
  softwareVersion?: string;
  timestamp: string;
}

export interface KnowledgeStatus {
  classification: KnowledgeClassification;
  evidenceLevel: EvidenceLevel;
  validationStatus: ValidationStatus;
  confidenceScore?: number;
  quality: EvidenceQuality;
  notes?: string;
}

export interface MeasurementResult {
  name: string;
  value?: number;
  unit?: string;
  uncertainty?: number;
  instrumentId?: string;
  quality: "RAW" | "VALIDATED" | "REJECTED" | "CORRECTED";
}

export interface ExperimentRecord {
  experimentId: string;
  source: KnowledgeSource;
  materialId: string;
  sample: SampleIdentity;
  protocol: ExtractionProtocol;
  purpose: ExperimentPurpose;
  objective: string;
  hypothesis?: string;
  variables: VariableControl[];
  results: MeasurementResult[];
  provenance: Provenance[];
  knowledgeStatus: KnowledgeStatus;
  createdAt: string;
}

export interface MaterialGap {
  gapId: string;
  materialId: string;
  sampleId?: string;
  parameter: string;
  reason: UnknownReason;
  priority: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  affectsInference: boolean;
  recommendedMeasurement?: string;
}

export interface FrequencySweepPoint {
  frequency_kHz: number;
  responseValue?: number;
  responseUnit?: string;
  temperature_C?: number;
  pressure_mbar?: number;
  power_W?: number;
  timestamp: string;
}

export interface DetectedPeak {
  peakId: string;
  sweepId: string;
  frequency_kHz: number;
  amplitude?: number;
  bandwidth_kHz?: number;
  prominence?: number;
  confidence?: number;
  classification: "OBSERVED_PEAK" | "POSSIBLE_RESONANCE" | "UNRESOLVED";
}

export interface FrequencySweep {
  sweepId: string;
  experimentId: string;
  sampleId: string;
  points: FrequencySweepPoint[];
  detectedPeaks: DetectedPeak[];
  analysisStatus: "RAW" | "ANALYZED" | "REVIEWED";
}

export interface ExperimentRecommendation {
  recommendationId: string;
  materialId: string;
  sampleId?: string;
  purpose: ExperimentPurpose;
  proposedParameters: Record<string, number | string>;
  reason: string;
  expectedInformationGain?: number;
  confirms?: string[];
  falsifies?: string[];
  knowledgeGaps: string[];
}

export interface ReportEvidenceLayers {
  verified: ExperimentRecord[];
  estimated: Array<{ statement: string; basis: string; confidence?: number }>;
  aiAnalysis: Array<{ statement: string; reasoning: string; confidence?: number }>;
  unknowns: MaterialGap[];
  nextExperiments: ExperimentRecommendation[];
}
