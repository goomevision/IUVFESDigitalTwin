import { describe, expect, it } from 'vitest';
import { assessValidationReadiness } from './scientificValidation';

describe('assessValidationReadiness', () => {
  const complete = {
    experimentExists: true,
    hasSensorObservations: true,
    hasInstrumentAssignments: true,
    allAssignedInstrumentsCalibrated: true,
    hasSimulationDataset: true,
    hasExperimentalDataset: true,
    hasProvenance: true,
    experimentStatus: 'completed',
  };

  it('allows scientific review only when the full evidence chain exists', () => {
    const result = assessValidationReadiness(complete);
    expect(result.status).toBe('READY_FOR_REVIEW');
    expect(result.eligibleForScientificReview).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('blocks review when calibration evidence is missing', () => {
    const result = assessValidationReadiness({ ...complete, allAssignedInstrumentsCalibrated: false });
    expect(result.status).toBe('INCOMPLETE');
    expect(result.eligibleForScientificReview).toBe(false);
    expect(result.reasons).toContain('At least one assigned instrument lacks valid calibration evidence.');
  });

  it('does not treat simulation data alone as experimental validation', () => {
    const result = assessValidationReadiness({
      ...complete,
      hasExperimentalDataset: false,
      hasSensorObservations: false,
    });
    expect(result.eligibleForScientificReview).toBe(false);
    expect(result.reasons).toContain('No experimental sensor observations have been recorded.');
    expect(result.reasons).toContain('No experimental dataset is linked to the experiment.');
  });
});
