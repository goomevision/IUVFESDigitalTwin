import { describe, expect, it } from 'vitest';
import { findMaterial, findSource, listDataGaps, SMKB_MATERIALS } from './scientificMaterialKnowledge';

describe('scientific material knowledge base', () => {
  it('contains traceable water standards', () => {
    const water = findMaterial('MAT-WATER');
    expect(water).toBeDefined();
    expect(water?.properties.some((p) => p.sourceId === 'SRC-IAPWS-95' && p.validationStatus === 'STANDARD')).toBe(true);
    expect(findSource('SRC-IAPWS-95')?.evidenceGrade).toBe('A');
  });

  it('keeps patchouli literature evidence distinct from measured data', () => {
    const patchouli = findMaterial('MAT-PATCHOULI-LEAF');
    expect(patchouli?.properties.some((p) => p.validationStatus === 'LITERATURE')).toBe(true);
    expect(patchouli?.properties.some((p) => p.validationStatus === 'MEASURED')).toBe(false);
  });

  it('surfaces unresolved material properties as explicit data gaps', () => {
    const gaps = listDataGaps();
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.some((p) => p.materialId === 'MAT-SS316L')).toBe(true);
  });

  it('does not silently invent numeric values for seed records', () => {
    const patchouli = SMKB_MATERIALS.find((m) => m.materialId === 'MAT-PATCHOULI-LEAF');
    const structuralGaps = patchouli?.properties.filter((p) => p.property === 'cellulose' || p.property === 'lignin');
    expect(structuralGaps?.every((p) => p.value === undefined && p.validationStatus === 'DATA_GAP')).toBe(true);
  });
});
