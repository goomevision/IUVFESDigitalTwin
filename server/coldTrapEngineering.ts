/**
 * Reduced-order cold-trap thermal load model.
 *
 * This model limits condensable removal by the installed heat-transfer
 * capacity and condensate inventory. It is not a multicomponent VLE model.
 */

export interface ColdTrapStageInput {
  temperatureC: number;
  volumeL: number;
  heatTransferAreaM2: number;
  condensateCapacityKg: number;
}

export interface ColdTrapLoadInput {
  streamTemperatureC: number;
  dtSeconds: number;
  incomingCondensableKg: number;
  overallHeatTransferCoefficientWPerM2K?: number;
  latentHeatKJPerKg?: number;
}

export interface ColdTrapLoadResult {
  heatRemovalKW: number;
  thermalCapacityKgPerSecond: number;
  condensedKg: number;
  remainingIncomingKg: number;
  capacityRemainingKg: number;
  effectiveness: number;
  status: 'REDUCED_ORDER_THERMAL_LIMIT' | 'DATA_GAP' | 'INVALID_INPUT';
  warnings: string[];
}

export function calculateColdTrapLoad(
  stage: ColdTrapStageInput,
  input: ColdTrapLoadInput,
): ColdTrapLoadResult {
  const U = input.overallHeatTransferCoefficientWPerM2K ?? 0;
  const latentHeatKJPerKg = input.latentHeatKJPerKg ?? 2257;
  const dt = Math.max(0, input.dtSeconds);
  const deltaT = Math.max(0, input.streamTemperatureC - stage.temperatureC);
  const warnings: string[] = [];

  if (
    ![stage.temperatureC, stage.volumeL, stage.heatTransferAreaM2, stage.condensateCapacityKg,
      input.streamTemperatureC, input.dtSeconds, input.incomingCondensableKg, U, latentHeatKJPerKg]
      .every(Number.isFinite) ||
    stage.volumeL < 0 || stage.heatTransferAreaM2 < 0 || stage.condensateCapacityKg < 0 ||
    input.incomingCondensableKg < 0 || U < 0 || latentHeatKJPerKg <= 0
  ) {
    return {
      heatRemovalKW: 0,
      thermalCapacityKgPerSecond: 0,
      condensedKg: 0,
      remainingIncomingKg: Math.max(0, input.incomingCondensableKg),
      capacityRemainingKg: Math.max(0, stage.condensateCapacityKg),
      effectiveness: 0,
      status: 'INVALID_INPUT',
      warnings: ['Cold-trap thermal input is invalid.'],
    };
  }

  if (U === 0 || stage.heatTransferAreaM2 === 0) {
    return {
      heatRemovalKW: 0,
      thermalCapacityKgPerSecond: 0,
      condensedKg: 0,
      remainingIncomingKg: input.incomingCondensableKg,
      capacityRemainingKg: stage.condensateCapacityKg,
      effectiveness: 0,
      status: 'DATA_GAP',
      warnings: ['Overall heat-transfer coefficient and/or heat-transfer area is not available.'],
    };
  }

  const heatRemovalKW = (U * stage.heatTransferAreaM2 * deltaT) / 1000;
  const thermalCapacityKgPerSecond = heatRemovalKW / latentHeatKJPerKg;
  const condensedKg = Math.min(
    input.incomingCondensableKg,
    stage.condensateCapacityKg,
    thermalCapacityKgPerSecond * dt,
  );
  const remainingIncomingKg = Math.max(0, input.incomingCondensableKg - condensedKg);
  const capacityRemainingKg = Math.max(0, stage.condensateCapacityKg - condensedKg);
  const effectiveness = input.incomingCondensableKg <= 0
    ? 0
    : condensedKg / input.incomingCondensableKg;

  if (stage.condensateCapacityKg <= condensedKg && input.incomingCondensableKg > condensedKg) {
    warnings.push('Cold-trap condensate inventory capacity reached during this step.');
  }

  return {
    heatRemovalKW,
    thermalCapacityKgPerSecond,
    condensedKg,
    remainingIncomingKg,
    capacityRemainingKg,
    effectiveness,
    status: 'REDUCED_ORDER_THERMAL_LIMIT',
    warnings,
  };
}
