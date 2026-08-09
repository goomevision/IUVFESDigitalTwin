import { describe, expect, it } from 'vitest';
import { IUVFES_VMMES_BASELINE } from './hardwareSpecification';
import { buildHardwareEngineeringProfile } from './hardwareEngineering';

describe('hardware engineering profile', () => {
  it('derives chamber volume and simulation inputs from geometry', () => {
    const profile = buildHardwareEngineeringProfile(
      IUVFES_VMMES_BASELINE,
      { innerDiameterM: 0.6, cylindricalLengthM: 0.884, wallThicknessM: 0.01 },
      8000,
    );

    expect(profile.validation.valid).toBe(true);
    expect(profile.derived.internalVolumeL).toBeCloseTo(250, 0);
    expect(profile.dynamics.chamberVolumeL).toBeCloseTo(profile.derived.internalVolumeL, 8);
    expect(profile.dynamics.pumpCapacityM3h).toBe(200);
    expect(profile.dynamics.heatingPowerKW).toBe(9);
  });

  it('keeps invalid geometry visible instead of silently correcting it', () => {
    const profile = buildHardwareEngineeringProfile(
      IUVFES_VMMES_BASELINE,
      { innerDiameterM: 0.6, cylindricalLengthM: 0.8, wallThicknessM: 0.4 },
    );

    expect(profile.validation.valid).toBe(false);
    expect(profile.validation.errors.length).toBeGreaterThan(0);
  });
});
