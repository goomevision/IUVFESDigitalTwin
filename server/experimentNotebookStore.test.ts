import { describe, expect, it } from 'vitest';
import { ExperimentNotebookStore } from './experimentNotebookStore';

describe('ExperimentNotebookStore', () => {
  it('records an experiment from setup through closeout without overwriting observations', () => {
    const store = new ExperimentNotebookStore();
    const experiment = store.start({
      title: 'Nilam vacuum extraction trial',
      researcherId: 'researcher-001',
      objective: 'Measure recovery under controlled vacuum.',
      hypothesis: 'Lower pressure increases recovery within the thermal limit.',
      material: { materialId: 'NILAM-001', sampleId: 'SAMPLE-001', massKg: 10 },
      equipment: [{ instrumentId: 'TEMP-001', role: 'temperature' }],
      procedure: ['Load sample', 'Seal chamber', 'Run vacuum', 'Record recovery'],
      inputParameters: { targetPressureMbar: 80, targetTemperatureC: 65 },
    }, new Date('2026-08-09T10:00:00Z'));

    store.begin(experiment.experimentId);
    store.addObservation(experiment.experimentId, { timestamp: '2026-08-09T10:01:00Z', parameter: 'temperature', value: 41.2, unit: 'C', source: 'SENSOR' });
    store.addObservation(experiment.experimentId, { timestamp: '2026-08-09T10:02:00Z', parameter: 'temperature', value: 42.0, unit: 'C', source: 'OPERATOR' });
    store.close({ experimentId: experiment.experimentId, outcome: 'SUCCESS', conclusion: 'Trial completed.', anomalies: [], rawDatasetId: 'IUVFES-DS-001', findings: ['Stable thermal ramp'] });

    const saved = store.get(experiment.experimentId);
    expect(saved.status).toBe('completed');
    expect(saved.observations).toHaveLength(2);
    expect(saved.datasetIds).toContain('IUVFES-DS-001');
  });
});
