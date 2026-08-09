import { describe, expect, it } from 'vitest';
import { ScientificProvenanceJournal } from './scientificProvenance';

describe('ScientificProvenanceJournal', () => {
  it('records traceable events for an experiment', () => {
    const journal = new ScientificProvenanceJournal();
    const event = journal.record({
      entityId: 'IUVFES-EXP-2026-000001',
      activity: 'RAW_TELEMETRY_CAPTURE',
      agentId: 'instrument:THERMO-001',
      timestamp: '2026-08-09T10:00:00Z',
      inputs: [{ id: 'sample:001', type: 'material-sample', role: 'source' }],
      outputs: [{ id: 'dataset:raw:001', type: 'dataset', role: 'raw-output' }],
    });

    expect(event.id).toHaveLength(24);
    expect(journal.list('IUVFES-EXP-2026-000001')).toHaveLength(1);
  });

  it('creates a reproducible SHA-256 dataset manifest', () => {
    const journal = new ScientificProvenanceJournal();
    const base = {
      datasetId: 'IUVFES-DS-001',
      version: '1.0.0',
      title: 'Test dataset',
      origin: 'EXPERIMENTAL' as const,
      qualityStatus: 'RAW' as const,
      createdAt: '2026-08-09T10:00:00Z',
      createdBy: 'researcher:test',
      instrumentIds: ['instrument:001'],
      calibrationIds: ['calibration:001'],
      softwareVersion: 'test',
      provenance: [],
    };

    const a = journal.buildDatasetManifest(base, [{ t: 1, value: 10 }]);
    const b = journal.buildDatasetManifest(base, [{ t: 1, value: 10 }]);
    const c = journal.buildDatasetManifest(base, [{ t: 1, value: 11 }]);

    expect(a.sha256).toBe(b.sha256);
    expect(a.sha256).not.toBe(c.sha256);
  });
});
