import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('SMKB aromatic biomass batch 2', () => {
  const file = path.resolve(process.cwd(), 'data/smkb/material-simulation-catalog-batch-2-aromatic-biomass.json');
  const catalog = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    materials: Array<{
      materialId: string;
      evidenceGrade: string;
      validationStatus: string;
      processRoutes: string[];
      literatureObservations: Array<Record<string, unknown>>;
      dataGaps: string[];
    }>;

  it('contains the expanded aromatic benchmark set', () => {
    expect(catalog.materials).toHaveLength(8);
    expect(catalog.materials.map((m) => m.materialId)).toEqual([
      'MAT-CITRONELLA-CYMB-NARDUS',
      'MAT-LAVENDER-L-ANGUSTIFOLIA',
      'MAT-CLOVE-S-AROMATICUM',
      'MAT-NUTMEG-M-FRAGRANS',
      'MAT-GINGER-Z-OFFICINALE',
      'MAT-ROSE-R-DAMASCENA',
      'MAT-JASMINE-J-SAMBAC',
      'MAT-CINNAMON-CINNAMOMUM-SP',
    ]);
  });

  it('keeps every material at literature evidence status', () => {
    for (const material of catalog.materials) {
      expect(material.evidenceGrade).toBe('B');
      expect(material.validationStatus).toBe('LITERATURE');
      expect(material.processRoutes.length).toBeGreaterThan(0);
      expect(material.literatureObservations.length).toBeGreaterThan(0);
      expect(material.dataGaps.length).toBeGreaterThan(0);
    }
  });

  it('does not silently promote literature to validated measurements', () => {
    expect(catalog.materials.some((m) => m.validationStatus === 'VALIDATED')).toBe(false);
    expect(catalog.materials.some((m) => m.validationStatus === 'MEASURED')).toBe(false);
  });
});
