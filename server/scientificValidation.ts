export type ValidationReadinessStatus = 'READY_FOR_REVIEW' | 'BLOCKED' | 'INCOMPLETE';

export interface ValidationReadinessInput {
  experimentExists: boolean;
  hasSensorObservations: boolean;
  hasInstrumentAssignments: boolean;
  allAssignedInstrumentsCalibrated: boolean;
  hasSimulationDataset: boolean;
  hasExperimentalDataset: boolean;
  hasProvenance: boolean;
  experimentStatus: string;
}

export interface ValidationReadiness {
  status: ValidationReadinessStatus;
  eligibleForScientificReview: boolean;
  reasons: string[];
  checks: Record<string, boolean>;
  message: string;
}

/**
 * Determines whether a research experiment has enough traceability to enter
 * scientific review. This does not validate the physical model or certify the
 * measurements; it only verifies that the required evidence chain exists.
 */
export function assessValidationReadiness(input: ValidationReadinessInput): ValidationReadiness {
  const checks = {
    experimentExists: input.experimentExists,
    terminalExperimentState: input.experimentStatus === 'completed' || input.experimentStatus === 'reviewed',
    sensorObservations: input.hasSensorObservations,
    instrumentAssignments: input.hasInstrumentAssignments,
    instrumentCalibration: input.allAssignedInstrumentsCalibrated,
    simulationDataset: input.hasSimulationDataset,
    experimentalDataset: input.hasExperimentalDataset,
    provenance: input.hasProvenance,
  };

  const reasons: string[] = [];
  if (!checks.experimentExists) reasons.push('Research experiment does not exist.');
  if (!checks.terminalExperimentState) reasons.push('Experiment must be completed or reviewed before scientific review.');
  if (!checks.sensorObservations) reasons.push('No experimental sensor observations have been recorded.');
  if (!checks.instrumentAssignments) reasons.push('No instruments are assigned to the experiment.');
  if (!checks.instrumentCalibration) reasons.push('At least one assigned instrument lacks valid calibration evidence.');
  if (!checks.simulationDataset) reasons.push('No simulation dataset is linked to the experiment.');
  if (!checks.experimentalDataset) reasons.push('No experimental dataset is linked to the experiment.');
  if (!checks.provenance) reasons.push('No provenance record links the evidence chain.');

  const evidenceComplete = Object.values(checks).every(Boolean);
  const eligibleForScientificReview = evidenceComplete;
  const message = evidenceComplete
    ? 'Evidence chain is complete enough to enter scientific review.'
    : reasons.join(' ');

  return {
    status: evidenceComplete ? 'READY_FOR_REVIEW' : input.experimentExists ? 'INCOMPLETE' : 'BLOCKED',
    eligibleForScientificReview,
    reasons,
    checks,
    message,
  };
}
