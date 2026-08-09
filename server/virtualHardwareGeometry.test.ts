import { describe, expect, it } from 'vitest';
import {
  deriveCylindricalChamber,
  validateCylindricalChamberGeometry,
} from './virtualHardwareGeometry';

describe('virtual hardware geometry', () => {
  it('derives volume, surface area and shell mass proxy', () => {
    const geometry = deriveCylindricalChamber(
      { innerDiameterM: 0.5, cylindricalLengthM: 1, wallThicknessM: 0.01 },
      8000,
    );

    expect(geometry.internalVolumeL).toBeCloseTo(196.3495, 3);
    expect(geometry.internalSurfaceAreaM2).toBeGreaterThan(1.5);
    expect(geometry.shellMetalMassKg).toBeGreaterThan(60);
  });

  it('rejects impossible geometry and flags extreme aspect ratio', () => {
    const invalid = validateCylindricalChamberGeometry({
      innerDiameterM: 0.5,
      cylindricalLengthM: 1,
      wallThicknessM: 0.3,
    });
    expect(invalid.valid).toBe(false);

    const elongated = validateCylindricalChamberGeometry({
      innerDiameterM: 0.1,
      cylindricalLengthM: 1.1,
      wallThicknessM: 0.005,
    });
    expect(elongated.valid).toBe(true);
    expect(elongated.warnings.join(' ')).toContain('structural stability');
  });
});
