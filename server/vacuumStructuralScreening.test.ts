import { describe, expect, it } from 'vitest';
import { screenVacuumShell } from './vacuumStructuralScreening';

describe('vacuum structural screening', () => {
  const base = {
    innerDiameterM: 0.6,
    cylindricalLengthM: 0.884,
    wallThicknessM: 0.01,
    designExternalPressureBar: 0.2,
    elasticModulusGPa: 193,
    poissonRatio: 0.3,
    yieldStrengthMPa: 170,
    safetyFactor: 3,
  };

  it('returns a preliminary screening result', () => {
    const result = screenVacuumShell(base);
    expect(result.status).toBe('PASS_SCREENING');
    expect(result.criticalElasticPressureBar).toBeGreaterThan(0);
    expect(result.allowableScreeningPressureBar).toBeGreaterThan(0);
    expect(result.utilization).toBeGreaterThan(0);
  });

  it('flags a design whose external pressure exceeds screening allowable', () => {
    const result = screenVacuumShell({ ...base, designExternalPressureBar: 100 });
    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.warnings.join(' ')).toContain('exceeds');
  });

  it('does not accept invalid geometry', () => {
    const result = screenVacuumShell({ ...base, wallThicknessM: 0 });
    expect(result.status).toBe('INVALID_INPUT');
  });
});
