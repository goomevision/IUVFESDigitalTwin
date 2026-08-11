/**
 * IUVFES Scientific Data Foundation
 *
 * Data contracts only. These types do not assert physical truth.
 * Unknown values remain null/UNKNOWN until evidence exists.
 */

export type DataSource = 'LITERATURE' | 'LABORATORY' | 'SIMULATION' | 'DERIVED' | 'HYPOTHESIS';
export type KnowledgeClassification = 'OBSERVED' | 'DERIVED' | 'HYPOTHESIS' | 'MODEL_FIT' | 'VALIDATED';
export type EvidenceLevel = 'LITERATURE' | 'LABORATORY' | 'SIMULATION' | 'MULTI_SOURCE';
export type ValidationStatus = 'UNKNOWN' | 'UNTESTED' | 'SUPPORTED' | 'CONTRADICTED';
export type ValueStatus = 'KNOWN' | 'UNKNOWN' | 'NOT_APPLICABLE';

export type ExtractionMethod =
  | 'UAE' | 'ULTRASONIC_BATH' | 'UMAE' | 'DISTILLATION'
  | 'STEAM_DISTILLATION' | 'HYDRODISTILLATION' | 'MACERATION' | 'OTHER';

export type ConfidenceMethod =
  | 'MANUAL' | 'SNR' | 'FIT_QUALITY' | 'REPLICATION'
  | 'MULTI_SOURCE' | 'VALIDATION';

export interface KnowledgeStatus {
  classification: KnowledgeClassification;
  confidenceScore?: number;
  confidenceMethod?: ConfidenceMethod;
  evidenceLevel: EvidenceLevel;
  validationStatus: ValidationStatus;
}

export interface Provenance {
  id: string;
  sourceType: 'LITERATURE' | 'LAB_INSTRUMENT' | 'SIMULATION_ENGINE' | 'DERIVED_CALCULATION';
  citation?: string;
  instrumentId?: string;
  operatorId?: string;
  datasetId?: string;
  originalFileHash?: string;
  importMethod: 'MANUAL' | 'API' | 'BULK_CSV' | 'REAL_TIME';
  timestamp: string;
  softwareVersion?: string;
  sourceConfidence?: number;
}

export interface Material {
  id: string;
  scientificName: string;
  commonName?: string;
  plantPart?: string;
  description?: string;
}

export interface MaterialAlias {
  materialId: string;
  alias: string;
  aliasType: 'COMMON_NAME' | 'SCIENTIFIC_NAME' | 'SYNONYM' | 'LOCAL_NAME' | 'SOURCE_LABEL';
  normalized: string;
}

export interface ExtractionProtocol {
  id: string;
  method: ExtractionMethod;
  solventType?: string;
  solventRatio?: string;
  frequencyKHz?: number | null;
  powerW?: number | null;
  amplitudePercent?: number | null;
  intensityWcm2?: number | null;
  dutyCyclePercent?: number | null;
  pulseCycleS?: number | null;
  timeMin?: number | null;
  temperatureC?: number | null;
  pressureMbar?: number | null;
  materialMassKg?: number | null;
  particleSizeMm?: number | null;
  moisturePercent?: number | null;
  enzymeSystem?: string | null;
  notes?: string;
}

export interface ExperimentResult {
  oilYieldPercent?: number | null;
  oilMassKg?: number | null;
  tpcMgGAEG?: number | null;
  flavonoidPpm?: number | null;
  targetCompoundConcentration?: Record<string, number | string | null>;
  waterRemovedKg?: number | null;
  energyConsumedKWh?: number | null;
  rawMeasurements?: Record<string, number | string | null>;
}

export interface ExperimentQuality {
  measurementUncertainty?: number | null;
  uncertaintyUnit?: string;
  instrumentUsed?: string;
  analyticalMethod?: string;
  operator?: string;
  replicationCount?: number | null;
  notes?: string;
}

export interface ExperimentRecord {
  id: string;
  materialId: string;
  source: DataSource;
  batchId?: string;
  timestamp: string;
  protocolId?: string;
  provenanceId: string;
  knowledgeStatus: KnowledgeStatus;
  results: ExperimentResult;
  quality: ExperimentQuality;
}

export type GapParameter =
  | 'frequency_response' | 'f0' | 'bandwidth' | 'q_factor'
  | 'activation_energy' | 'acoustic_intensity' | 'cavitation_response'
  | 'fraction_identity' | 'source_verification' | 'protocol_completeness';

export type GapReason =
  | 'NO_DATA' | 'INSUFFICIENT_SWEEP' | 'CONFLICTING_LITERATURE'
  | 'MISSING_INSTRUMENT_MEASUREMENT' | 'MISSING_SOURCE_METADATA';

export interface MaterialGap {
  id: string;
  materialId: string;
  parameter: GapParameter;
  reason: GapReason;
  priority: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  evidenceNeeded?: string;
}

export interface EvidenceConflict {
  id: string;
  materialId: string;
  field: string;
  recordIds: string[];
  conflictType: 'VALUE_DIFFERENCE' | 'UNIT_DIFFERENCE' | 'PROTOCOL_DIFFERENCE' | 'SOURCE_AMBIGUITY';
  resolutionStatus: 'OPEN' | 'REVIEWED' | 'RESOLVED';
  explanation?: string;
}

export interface FrequencySweep {
  id: string;
  materialId: string;
  experimentId: string;
  startFrequencyKHz: number;
  endFrequencyKHz: number;
  stepKHz: number;
  createdAt: string;
  provenanceId: string;
}

export interface SweepPoint {
  id: string;
  sweepId: string;
  frequencyKHz: number;
  yieldPercent?: number | null;
  massRateKgS?: number | null;
  powerW?: number | null;
  intensityWcm2?: number | null;
  temperatureC?: number | null;
  pressureMbar?: number | null;
  responseValue?: number | null;
  uncertainty?: number | null;
}

export interface DetectedPeak {
  id: string;
  sweepId: string;
  f0KHz: number;
  bandwidthKHz?: number | null;
  amplitude?: number | null;
  prominence?: number | null;
  snr?: number | null;
  confidence?: number | null;
  fittingMethod?: 'DERIVATIVE' | 'FWHM' | 'LORENTZIAN' | 'OTHER';
  knowledgeStatus: KnowledgeStatus;
}

export interface MaterialProfile {
  id: string;
  materialId: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
  supersededBy?: string | null;
  createdAt: string;
  createdFromExperimentId?: string | null;
  provenanceId: string;
}

export interface FractionProfile {
  id: string;
  materialProfileId: string;
  label: string;
  f0KHz?: number | null;
  bandwidthKHz?: number | null;
  amplitude?: number | null;
  activationEnergyModel?: number | null;
  valueStatus: ValueStatus;
  knowledgeStatus: KnowledgeStatus;
}

export interface ExperimentRecommendation {
  id: string;
  materialId: string;
  targetFrequencyKHz?: number | null;
  frequencyRangeKHz?: { min: number; max: number } | null;
  expectedInformationGain?: number | null;
  uncertaintyScore?: number | null;
  priority: number;
  reason: string;
  modelVersion?: string;
  status: 'PROPOSED' | 'ACCEPTED' | 'EXECUTED' | 'REJECTED';
}
