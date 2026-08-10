import { describe, expect, it } from 'vitest';
import { calculateWaterMassBalance } from './massBalanceDiagnostics';

describe('water mass balance diagnostics', () => {
  it('closes the model boundary when the remainder is explicitly accounted for', () => {
    const result = calculateWaterMassBalance({ waterRemovedKg: 2, coldTrapCondensedWaterKg: 1.25 });
    expect(result.condensedWaterKg).toBe(1.25);
    expect(result.uncondensedOrUnaccountedWaterKg).toBe(0.75);
    expect(result.closureErrorKg).toBe(0);
    expect(result.status).toBe('CLOSED');
  });

  it('bounds condensed water to the amount removed from the matrix', () => {
    const result = calculateWaterMassBalance({ waterRemovedKg: 1, coldTrapCondensedWaterKg: 2 });
    expect(result.condensedWaterKg).toBe(1);
    expect(result.uncondensedOrUnaccountedWaterKg).toBe(0);
    expect(result.status).toBe('CLOSED');
  });

  it('rejects invalid mass inputs', () => {
    const result = calculateWaterMassBalance({ waterRemovedKg: -1, coldTrapCondensedWaterKg: 1 });
    expect(result.status).toBe('INVALID_INPUT');
  });
});
