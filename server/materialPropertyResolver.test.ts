import { describe, expect, it } from 'vitest';
import { interpolateLinear, resolveMaterialProperty } from './materialPropertyResolver';

describe('materialPropertyResolver', () => {
  const steel = {
    materialId: 'MAT-SS316L-SANMAC',
    name: 'Sanmac 316/316L',
    states: ['SOLID'],
    evidenceGrade: 'C',
    validationStatus: 'MANUFACTURER_DATA',
    properties: [
      {
        name: 'thermal_conductivity',
        unit: 'W/m/K',
        temperaturePointsC: [20, 100, 200, 300],
        values: [14, 15, 17, 18],
        source: 'Alleima',
        sourceUrl: 'https://www.alleima.com/',
      },
    ],
    dataGaps: ['surface_emissivity'],
  };

  it('interpolates within a tabulated evidence range', () => {
    expect(interpolateLinear(150, [100, 200], [15, 17])).toBe(16);
  });

  it('resolves temperature-dependent properties without extrapolation', () => {
    const result = resolveMaterialProperty(steel, 'thermal_conductivity', { temperatureC: 150, state: 'SOLID' });
    expect(result.status).toBe('RESOLVED');
    expect(result.value).toBe(16);
    expect(result.interpolated).toBe(true);
  });

  it('returns DATA_GAP outside the evidence range', () => {
    const result = resolveMaterialProperty(steel, 'thermal_conductivity', { temperatureC: 500, state: 'SOLID' });
    expect(result.status).toBe('DATA_GAP');
  });

  it('does not invent missing properties', () => {
    const result = resolveMaterialProperty(steel, 'surface_emissivity', { temperatureC: 300, state: 'SOLID' });
    expect(result.status).toBe('DATA_GAP');
  });

  it('rejects states not represented by the evidence catalog', () => {
    const result = resolveMaterialProperty(steel, 'thermal_conductivity', { temperatureC: 300, state: 'LIQUID' });
    expect(result.status).toBe('UNSUPPORTED_STATE');
  });
});
