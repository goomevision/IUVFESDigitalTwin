import { describe, expect, it } from 'vitest';
import { buildDatasetManifest, sha256Utf8 } from './scientificDataset';

describe('scientific dataset manifests', () => {
  it('produces deterministic SHA-256 fingerprints', () => {
    expect(sha256Utf8('IUVFES')).toBe(sha256Utf8('IUVFES'));
    expect(sha256Utf8('IUVFES')).not.toBe(sha256Utf8('IUVFES-v2'));
  });

  it('deduplicates provenance and experiment references', () => {
    const manifest = buildDatasetManifest({
      datasetId: 'DS-001', version: '1.0.0', name: 'Trial', origin: 'EXPERIMENTAL',
      qualityStatus: 'VALIDATED', content: '{"temperature":42}', storageRef: 'object://lab/DS-001',
      experimentIds: ['EXP-1', 'EXP-1'], provenanceRefs: ['PROV-1', 'PROV-1'],
    });
    expect(manifest.experimentIds).toEqual(['EXP-1']);
    expect(manifest.provenanceRefs).toEqual(['PROV-1']);
    expect(manifest.sha256).toHaveLength(64);
  });
});
