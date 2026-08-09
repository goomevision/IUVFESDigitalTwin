/**
 * Deterministic mass and energy balance checks for experimental and simulated runs.
 * The validator reports closure errors; it never silently repairs or normalizes data.
 */

export interface MassBalanceInput {
  materialInKg: number;
  waterRemovedKg?: number;
  oilRecoveredKg?: number;
  solidRecoveredKg?: number;
  wasteKg?: number;
  otherOutputKg?: number;
}

export interface EnergyBalanceInput {
  energyInputKwh: number;
  heatingKwh?: number;
  vacuumKwh?: number;
  extractionKwh?: number;
  coolingKwh?: number;
  otherKwh?: number;
}

export interface BalanceTolerance {
  absoluteKg?: number;
  relativePercent?: number;
}

export interface BalanceResult {
  input: number;
  accountedOutput: number;
  closureError: number;
  closurePercent: number;
  withinTolerance: boolean;
  verdict: "PASS" | "FAIL" | "INCONCLUSIVE";
}

function finite(value: number): boolean {
  return Number.isFinite(value);
}

function evaluateClosure(input: number, output: number, tolerance?: BalanceTolerance): BalanceResult {
  const closureError = input - output;
  const closurePercent = input === 0 ? NaN : Math.abs(closureError) / Math.abs(input) * 100;
  const hasTolerance = tolerance?.absoluteKg !== undefined || tolerance?.relativePercent !== undefined;
  const absoluteOk = tolerance?.absoluteKg === undefined || Math.abs(closureError) <= tolerance.absoluteKg;
  const relativeOk = tolerance?.relativePercent === undefined || closurePercent <= tolerance.relativePercent;
  const withinTolerance = hasTolerance && absoluteOk && relativeOk;
  return {
    input,
    accountedOutput: output,
    closureError,
    closurePercent,
    withinTolerance,
    verdict: !finite(input) || !finite(output) ? "INCONCLUSIVE" : !hasTolerance ? "INCONCLUSIVE" : withinTolerance ? "PASS" : "FAIL",
  };
}

export function validateMassBalance(input: MassBalanceInput, tolerance?: BalanceTolerance): BalanceResult {
  const outputs = [input.waterRemovedKg, input.oilRecoveredKg, input.solidRecoveredKg, input.wasteKg, input.otherOutputKg]
    .filter((value): value is number => value !== undefined);
  if (!finite(input.materialInKg) || outputs.some(value => !finite(value))) {
    return evaluateClosure(NaN, NaN, tolerance);
  }
  return evaluateClosure(input.materialInKg, outputs.reduce((sum, value) => sum + value, 0), tolerance);
}

export function validateEnergyBalance(input: EnergyBalanceInput, tolerance?: BalanceTolerance): BalanceResult {
  const components = [input.heatingKwh, input.vacuumKwh, input.extractionKwh, input.coolingKwh, input.otherKwh]
    .filter((value): value is number => value !== undefined);
  if (!finite(input.energyInputKwh) || components.some(value => !finite(value))) {
    return evaluateClosure(NaN, NaN, tolerance);
  }
  return evaluateClosure(input.energyInputKwh, components.reduce((sum, value) => sum + value, 0), tolerance);
}
