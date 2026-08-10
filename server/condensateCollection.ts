/**
 * Four-vessel condensate collection mass balance.
 *
 * This is an explicit routing layer, not a chemical VLE model. Water is routed
 * to vessel 1. Recovered oil is routed across vessels 2-4 according to an
 * externally supplied, normalized fraction vector. The default keeps all oil
 * in the main-oil vessel until validated fraction data is available.
 */

export type CollectionRoutingStatus = 'ROUTED' | 'CAPACITY_LIMIT' | 'DATA_GAP' | 'INVALID_INPUT';

export interface CondensateCollectionInput {
  deltaWaterKg: number;
  deltaOilKg: number;
  existingMassKg: [number, number, number, number];
  capacityKg: [number, number, number, number];
  oilRoutingFractions?: [number, number, number];
}

export interface CondensateCollectionResult {
  addedMassKg: [number, number, number, number];
  totalMassKg: [number, number, number, number];
  collectedWaterKg: number;
  collectedOilKg: number;
  unroutedWaterKg: number;
  unroutedOilKg: number;
  status: CollectionRoutingStatus;
  warnings: string[];
}

function validTuple(values: [number, number, number, number]): boolean {
  return values.every((value) => Number.isFinite(value) && value >= 0);
}

function normalizedOilFractions(input?: [number, number, number]): [number, number, number] | null {
  const fractions = input ?? [0, 1, 0];
  if (!fractions.every((value) => Number.isFinite(value) && value >= 0)) return null;
  const total = fractions[0] + fractions[1] + fractions[2];
  if (total <= 0) return null;
  return [fractions[0] / total, fractions[1] / total, fractions[2] / total];
}

export function routeCondensateCollection(input: CondensateCollectionInput): CondensateCollectionResult {
  const warnings: string[] = [];
  const fractions = normalizedOilFractions(input.oilRoutingFractions);
  if (
    !Number.isFinite(input.deltaWaterKg) || input.deltaWaterKg < 0 ||
    !Number.isFinite(input.deltaOilKg) || input.deltaOilKg < 0 ||
    !validTuple(input.existingMassKg) || !validTuple(input.capacityKg)
  ) {
    return {
      addedMassKg: [0, 0, 0, 0],
      totalMassKg: input.existingMassKg,
      collectedWaterKg: 0,
      collectedOilKg: 0,
      unroutedWaterKg: Math.max(0, input.deltaWaterKg || 0),
      unroutedOilKg: Math.max(0, input.deltaOilKg || 0),
      status: 'INVALID_INPUT',
      warnings: ['Condensate collection input is invalid.'],
    };
  }
  if (!fractions) {
    return {
      addedMassKg: [0, 0, 0, 0],
      totalMassKg: [...input.existingMassKg] as [number, number, number, number],
      collectedWaterKg: 0,
      collectedOilKg: 0,
      unroutedWaterKg: input.deltaWaterKg,
      unroutedOilKg: input.deltaOilKg,
      status: 'DATA_GAP',
      warnings: ['Oil fraction routing is not available; oil remains unrouted.'],
    };
  }

  const added: [number, number, number, number] = [0, 0, 0, 0];
  let remainingWater = input.deltaWaterKg;
  let remainingOil = input.deltaOilKg;

  const waterCapacity = Math.max(0, input.capacityKg[0] - input.existingMassKg[0]);
  added[0] = Math.min(remainingWater, waterCapacity);
  remainingWater -= added[0];

  for (let i = 0; i < 3; i += 1) {
    const vesselIndex = i + 1;
    const requested = input.deltaOilKg * fractions[i];
    const available = Math.max(0, input.capacityKg[vesselIndex] - input.existingMassKg[vesselIndex]);
    added[vesselIndex] = Math.min(requested, available);
    remainingOil -= added[vesselIndex];
  }

  const totalMass: [number, number, number, number] = [
    input.existingMassKg[0] + added[0],
    input.existingMassKg[1] + added[1],
    input.existingMassKg[2] + added[2],
    input.existingMassKg[3] + added[3],
  ];

  const capacityLimited = remainingWater > 1e-12 || remainingOil > 1e-12;
  if (capacityLimited) warnings.push('One or more collection vessels reached capacity; remaining mass is retained as unrouted condensate.');
  if ((input.oilRoutingFractions ?? [0, 1, 0])[0] === 0 && (input.oilRoutingFractions ?? [0, 1, 0])[2] === 0) {
    warnings.push('Light and heavy oil fraction routing is zero by default until validated fraction data is supplied.');
  }

  return {
    addedMassKg: added,
    totalMassKg: totalMass,
    collectedWaterKg: added[0],
    collectedOilKg: added[1] + added[2] + added[3],
    unroutedWaterKg: remainingWater,
    unroutedOilKg: Math.max(0, remainingOil),
    status: capacityLimited ? 'CAPACITY_LIMIT' : 'ROUTED',
    warnings,
  };
}
