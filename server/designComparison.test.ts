import { describe, expect, it } from 'vitest';
import { compareHardwareDesigns } from './designComparison';

describe('hardware design comparison', () => {
  it('compares geometry and preliminary structural screening without calling it safety', () => {
    const results = compareHardwareDesigns([
      {
        id: 'DESIGN-A',
        geometry: { innerDiameterM: 0.5, cylindricalLengthM: 1, wallThicknessM: 0.01 },
        materialDensityKgPerM3: 8000,
        structural: {
          designExternalPressureBar: 0.5,
          elasticModulusGPa: 193,
          poissonRatio: 0.3,
          yieldStrengthMPa: 170,
          safetyFactor: 2,
        },
      },
      {
        id: 'DESIGN-B',
        geometry: { innerDiameterM: 0.6, cylindricalLengthM: 1, wallThicknessM: 0.01 },
        materialDensityKgPerM3: 8000,
      },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].structuralStatus).not.toBe('NOT_EVALUATED');
    expect(results[1].structuralStatus).toBe('NOT_EVALUATED');
    expect(results[0].volumeL).toBeLessThan(results[1].volumeL ?? Infinity);
    expect(results[0].warnings.join(' ')).not.toContain('safe');
  });

  it('keeps invalid candidates visible instead of dropping them', () => {
    const results = compareHardwareDesigns([
      {
        id: 'INVALID',
        geometry: { innerDiameterM: 0, cylindricalLengthM: 1, wallThicknessM: 0.01 },
      },
    ]);

    expect(results[0].structuralStatus).toBe('INVALID_INPUT');
    expect(results[0].geometryValid).toBe(false);
  });
});
