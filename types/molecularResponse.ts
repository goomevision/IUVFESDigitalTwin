/**
 * IUVFES Molecular Response / Inference contracts.
 *
 * IMPORTANT SCIENTIFIC BOUNDARY:
 * These contracts represent measured responses and model inferences.
 * They do NOT assert that an ultrasonic frequency directly counts or
 * selectively breaks a named molecule unless independent evidence validates it.
 */

export type ResponseSource =
  | 'LABORATORY'
  | 'SIMULATION'
  | 'DERIVED'
  | 'HYPOTHESIS';

export type ResponseClassification =
  | 'OBSERVED_RESPONSE'
  | 'MODEL_FIT'
  | 'INFERRED_COMPOSITION'
  | 'HYPOTHESIS'
  | 'VALIDATED';

export type AnalyticalMethod =
  | 'GC_MS'
  | 'HPLC'
  | 'LC_MS'
  | 'NMR'
  | 'GRAVIMETRIC'
  | 'SPECTROSCOPY'
  | 'OTHER';

export interface AcousticCondition {
  frequencyKHz: number;
  powerW?: number | null;
  intensityWcm2?: number | null;
  amplitudePercent?: number | null;
  dutyCyclePercent?: number | null;
  pressureMbar?: number | null;
  temperatureC?: number | null;
  solvent?: string | null;
}

export interface ResponseObservation {
  id: string;
  materialId: string;
  sweepId?: string | null;
  condition: AcousticCondition;
  responseMetric: 'YIELD' | 'MASS_RELEASED' | 'MASS_RATE' | 'CONCENTRATION' | 'OTHER';
  responseValue: number;
  responseUnit: string;
  uncertainty?: number | null;
  source: ResponseSource;
  classification: ResponseClassification;
  provenanceId: string;
}

export interface CompoundMeasurement {
  id: string;
  materialId: string;
  experimentId: string;
  compoundName: string;
  analyticalMethod: AnalyticalMethod;
  concentration?: number | null;
  concentrationUnit?: string | null;
  massReleased?: number | null;
  massUnit?: string | null;
  molecularWeightGPerMol?: number | null;
  measurementUncertainty?: number | null;
  provenanceId: string;
}

export interface MolecularQuantityInference {
  id: string;
  compoundMeasurementId: string;
  massG?: number | null;
  mol?: number | null;
  moleculeCount?: number | null;
  calculationVersion: string;
  uncertaintyMethod?: string | null;
  confidence?: number | null;
  classification: 'DERIVED' | 'VALIDATED';
}

export interface SelectivityHypothesis {
  id: string;
  materialId: string;
  targetLabel: string;
  f0KHz?: number | null;
  bandwidthKHz?: number | null;
  modelValue?: number | null;
  modelName: 'LORENTZIAN' | 'GAUSSIAN' | 'OTHER';
  valueStatus: 'UNKNOWN' | 'HYPOTHESIS' | 'MODEL_FIT' | 'VALIDATED';
  confidence?: number | null;
  evidenceId?: string | null;
}

export interface ResponseCompoundAssociation {
  id: string;
  responseObservationId: string;
  compoundMeasurementId: string;
  associationScore?: number | null;
  associationMethod: 'CORRELATION' | 'REGRESSION' | 'MULTIVARIATE' | 'EXPERT_REVIEW';
  status: 'HYPOTHESIS' | 'MODEL_FIT' | 'SUPPORTED' | 'CONTRADICTED';
  modelVersion?: string | null;
}

export interface MolecularCounterReport {
  id: string;
  materialId: string;
  experimentId?: string | null;
  generatedAt: string;
  responseCount: number;
  compoundCount: number;
  inferredCompoundCount: number;
  validatedCompoundCount: number;
  unknownCompoundCount: number;
  reportStatus: 'PARTIAL' | 'INFERENTIAL' | 'VALIDATED';
  scientificWarning: string;
}
