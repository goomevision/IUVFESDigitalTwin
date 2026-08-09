import { describe, expect, it } from 'vitest';
import patchouliBatch from '../data/smkb/patchouli-literature-batch-1.json';

describe('SMKB patchouli literature batch 1', () => {
  it('contains only literature evidence and never presents it as validated', () => {
    expect(patchouliBatch.status).toBe('LITERATURE_EVIDENCE');
    expect(patchouliBatch.governance.useAsUniversalConstants).toBe(false);
    expect(patchouliBatch.governance.defaultValidationStatus).toBe('LITERATURE');
    expect(patchouliBatch.records.length).toBeGreaterThanOrEqual(10);
    expect(patchouliBatch.records.every((record) => record.evidenceGrade === 'B')).toBe(true);
  });

  it('keeps operating conditions attached to quantitative observations', () => {
    for (const record of patchouliBatch.records) {
      expect(record.condition).toBeTruthy();
      expect(record.source).toBeTruthy();
      expect(record.source.title).toBeTruthy();
      expect(record.source.type).toBeTruthy();
    }
  });
});
