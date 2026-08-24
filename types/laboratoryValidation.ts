/**
 * IUVFES Laboratory Validation Contract
 *
 * These types represent empirical evidence and its comparison to a specific
 * Digital Twin run. They deliberately do not imply that a result is valid
 * merely because the record exists.
 */

export type LaboratoryValidationResult =
  | 'PASS'
  | 'PASS_WITH_LIMITATIONS'
  | 'FAIL'
  | 'INCONCLUSIVE'
  | 'NOT_VALIDATED';

export type ValidationMetricName =
  | 'ABSOLUTE_ERROR'
  | 'PERCENT_ERROR'
  | 'MAE'
  | 'RMSE'
  | 'MAX_ABSOLUTE_ERROR'
  | 'MASS_CLOSURE_ERROR'
  | 'ENERGY_CLOSURE_ERROR';

export interface InstrumentRecord {
  instrumentId: string;
  measurement: string;
  unit: string;
  calibrationId?: string;
  calibrationValidUntil?: string;
  uncertainty?: number | null;
}

export interface LaboratoryObservation {
  timestamp: string;
  signal: string;
  value: number;
  unit: string;
  instrumentId?: string;
}

export interface LaboratoryRunManifest {
  experimentId: string;
  dateTimeStart: string;
  dateTimeEnd?: string;
  operator?: string;
  apparatusId?: string;
  configurationId?: string;
  sampleId?: string;
  materialContext?: string;
  instruments: InstrumentRecord[];
  rawDataReferences: string[];
  samplingIntervalSeconds?: number | null;
  timeBasis?: string;
  alignmentMethod?: string;
}

export interface SimulationSnapshotReference {
  runId: string;
  modelVersion: string;
  commitSha: string;
  inputSnapshotReference: string;
  parameterSetReference?: string;
}

export interface ValidationAcceptanceCriterion {
  signal: string;
  metric: ValidationMetricName;
  maximumAllowed?: number | null;
  minimumAllowed?: number | null;
  unit?: string;
  rationale: string;
}

export interface ValidationMetric {
  signal: string;
  metric: ValidationMetricName;
  value: number;
  unit?: string;
  acceptance?: ValidationAcceptanceCriterion;
  passed?: boolean;
}

export interface LaboratoryValidationRecord {
  experiment: LaboratoryRunManifest;
  simulation: SimulationSnapshotReference;
  observations: LaboratoryObservation[];
  metrics: ValidationMetric[];
  acceptanceCriteriaReference: string;
  uncertaintyMethod?: string;
  holdoutRun: boolean;
  result: LaboratoryValidationResult;
  limitations: string[];
  deviations: string[];
  reviewer?: string;
  reviewDate?: string;
}

/**
 * Conservative validation gate.
 *
 * A PASS is impossible unless provenance, measured observations, simulation
 * identity, declared criteria, and hold-out evidence are present.
 */
export function isLaboratoryValidationEligible(record: LaboratoryValidationRecord): boolean {
  if (!record.experiment.experimentId) return false;
  if (record.experiment.rawDataReferences.length === 0) return false;
  if (record.experiment.instruments.length === 0) return false;
  if (record.observations.length === 0) return false;
  if (!record.simulation.runId || !record.simulation.modelVersion || !record.simulation.commitSha) return false;
  if (!record.simulation.inputSnapshotReference) return false;
  if (!record.acceptanceCriteriaReference) return false;
  if (!record.holdoutRun) return false;

  return record.metrics.length > 0 && record.metrics.every((metric) => metric.passed === true);
}

export function resolveLaboratoryValidationResult(
  record: LaboratoryValidationRecord,
): LaboratoryValidationResult {
  if (!isLaboratoryValidationEligible(record)) {
    return 'INCONCLUSIVE';
  }

  if (record.limitations.length > 0 || record.deviations.length > 0) {
    return 'PASS_WITH_LIMITATIONS';
  }

  return 'PASS';
}
