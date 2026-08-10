import { describe, expect, it } from 'vitest';
import { routeCondensateCollection } from './condensateCollection';

describe('condensate collection routing', () => {
  it('routes water to H2O vessel and oil to the main-oil vessel by default', () => {
    const result = routeCondensateCollection({
      deltaWaterKg: 1.5,
      deltaOilKg: 0.8,
      existingMassKg: [0, 0, 0, 0],
      capacityKg: [2, 2, 2, 2],
    });

    expect(result.addedMassKg).toEqual([1.5, 0, 0.8, 0]);
    expect(result.totalMassKg).toEqual([1.5, 0, 0.8, 0]);
    expect(result.unroutedWaterKg).toBe(0);
    expect(result.unroutedOilKg).toBe(0);
  });

  it('respects receiver capacity and exposes the remaining mass', () => {
    const result = routeCondensateCollection({
      deltaWaterKg: 3,
      deltaOilKg: 3,
      existingMassKg: [1.5, 0, 1.5, 0],
      capacityKg: [2, 2, 2, 2],
    });

    expect(result.addedMassKg).toEqual([0.5, 0, 0.5, 0]);
    expect(result.status).toBe('CAPACITY_LIMIT');
    expect(result.unroutedWaterKg).toBe(2.5);
    expect(result.unroutedOilKg).toBe(2.5);
  });

  it('supports an explicit validated light/main/heavy oil routing vector', () => {
    const result = routeCondensateCollection({
      deltaWaterKg: 0,
      deltaOilKg: 3,
      existingMassKg: [0, 0, 0, 0],
      capacityKg: [1, 2, 2, 2],
      oilRoutingFractions: [0.2, 0.5, 0.3],
    });

    expect(result.addedMassKg).toEqual([0, 0.6, 1.5, 0.9]);
    expect(result.collectedOilKg).toBe(3);
    expect(result.unroutedOilKg).toBe(0);
  });
});
