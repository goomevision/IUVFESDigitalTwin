import { describe, expect, it } from 'vitest';
import { assertMaterialKnowledgeBaseGovernance, validateMaterialEvidence } from './scientificMaterialGovernance';
import { SMKB_MATERIALS, SMKB_SOURCES } from './scientificMaterialKnowledge';

describe('scientific material knowledge governance', () => {
  it('accepts the current evidence catalog without inventing data', () => {
    expect(validateMaterialEvidence(SMKB_MATERIALS, SMKB_SOURCES)).toEqual([]);
    expect(() => assertMaterialKnowledgeBaseGovernance(SMKB_MATERIALS, SMKB_SOURCES)).not.toThrow();
  });

  it('rejects a data gap that contains an inferred numeric value', () => {
    const materials = [{
      materialId: 'MAT-X',
      commonName: 'Example',
      category: 'OTHER' as const,
      properties: [{
        evidenceId: 'EVD-X',
        materialId: 'MAT-X',
        property: 'specific_heat',
        value: 1,
        unit: 'kJ/kg/K',
        sourceId: 'SRC-X',
        validationStatus: 'DATA_GAP' as const,
      }],
    }];
    const sources = [{
      sourceId: 'SRC-X',
      title: 'Example source',
      sourceType: 'JOURNAL' as const,
      evidenceGrade: 'B' as const,
    }];

    expect(validateMaterialEvidence(materials, sources).map((issue) => issue.code)).toContain('DATA_GAP_HAS_VALUE');
  });
});
