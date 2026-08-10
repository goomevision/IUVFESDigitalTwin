/**
 * Explicit accounting diagnostics for the simulation water pathway.
 *
 * This does not claim a complete process mass balance. It only closes the
 * water-like stream from matrix removal to cold-trap capture and reports the
 * remainder as uncondensed/unaccounted water for the current model boundary.
 */

export interface WaterMassBalanceInput {
  waterRemovedKg: number;
  coldTrapCondensedWaterKg: number;
}

export interface WaterMassBalanceResult {
  waterRemovedKg: number;
  condensedWaterKg: number;
  uncondensedOrUnaccountedWaterKg: number;
  closureErrorKg: number;
  status: 'CLOSED' | 'OPEN' | 'INVALID_INPUT';
}

export function calculateWaterMassBalance(input: WaterMassBalanceInput): WaterMassBalanceResult {
  const values = [input.waterRemovedKg, input.coldTrapCondensedWaterKg];
  if (!values.every(Number.isFinite) || input.waterRemovedKg < 0 || input.coldTrapCondensedWaterKg < 0) {
    return {
      waterRemovedKg: Math.max(0, input.waterRemovedKg || 0),
      condensedWaterKg: Math.max(0, input.coldTrapCondensedWaterKg || 0),
      uncondensedOrUnaccountedWaterKg: 0,
      closureErrorKg: 0,
      status: 'INVALID_INPUT',
    };
  }

  const condensedWaterKg = Math.min(input.waterRemovedKg, input.coldTrapCondensedWaterKg);
  const uncondensedOrUnaccountedWaterKg = Math.max(0, input.waterRemovedKg - condensedWaterKg);
  const closureErrorKg = input.waterRemovedKg - condensedWaterKg - uncondensedOrUnaccountedWaterKg;

  return {
    waterRemovedKg: input.waterRemovedKg,
    condensedWaterKg,
    uncondensedOrUnaccountedWaterKg,
    closureErrorKg,
    status: Math.abs(closureErrorKg) <= 1e-9 ? 'CLOSED' : 'OPEN',
  };
}
