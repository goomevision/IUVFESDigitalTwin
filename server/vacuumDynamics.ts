export type VacuumDynamicsInput = {
  timeStepS: number;
  absolutePressureKPa: number;
  vesselVolumeM3: number;
  gasTemperatureK: number;
  pumpSpeedM3PerS: number;
  valveOpening: number;
  vaporGenerationKgPerS: number;
  gasMolarMassKgPerMol: number;
};

export type VacuumDynamicsResult = {
  absolutePressureKPa: number;
  pressureRateKPaPerS: number;
  gasMoles: number;
  pumpThroughputM3PerS: number;
  pressureShockIndex: number;
  warnings: string[];
};

const R = 8.31446261815324;

/**
 * First-order ideal-gas vessel model for transient vacuum dynamics.
 * This is an engineering dynamics layer, not a pump OEM model or a
 * non-equilibrium two-phase solver. Vapor generation must come from the
 * thermodynamic/process model and is never invented here.
 */
export function stepVacuumDynamics(input: VacuumDynamicsInput): VacuumDynamicsResult {
  if (input.timeStepS <= 0 || input.vesselVolumeM3 <= 0 || input.gasTemperatureK <= 0 || input.gasMolarMassKgPerMol <= 0) {
    throw new Error("Invalid vacuum dynamics state: dt, volume, temperature and molar mass must be positive.");
  }

  const opening = Math.max(0, Math.min(1, input.valveOpening));
  const pumpThroughputM3PerS = Math.max(0, input.pumpSpeedM3PerS) * opening;
  const pressurePa = input.absolutePressureKPa * 1000;
  const n = (pressurePa * input.vesselVolumeM3) / (R * input.gasTemperatureK);
  const generatedMolesPerS = Math.max(0, input.vaporGenerationKgPerS) / input.gasMolarMassKgPerMol;
  const pumpedMolesPerS = (pressurePa * pumpThroughputM3PerS) / (R * input.gasTemperatureK);
  const dnDt = generatedMolesPerS - pumpedMolesPerS;
  const nextN = Math.max(0, n + dnDt * input.timeStepS);
  const nextPressurePa = (nextN * R * input.gasTemperatureK) / input.vesselVolumeM3;
  const pressureRateKPaPerS = (nextPressurePa - pressurePa) / input.timeStepS / 1000;
  const shockIndex = Math.abs(pressureRateKPaPerS) / Math.max(input.absolutePressureKPa, 1e-9);

  const warnings: string[] = [];
  if (pressureRateKPaPerS < 0 && shockIndex > 0.1) warnings.push("RAPID_DECOMPRESSION_TRANSIENT");
  if (pressureRateKPaPerS > 0 && shockIndex > 0.1) warnings.push("RAPID_PRESSURE_RISE_TRANSIENT");
  if (input.absolutePressureKPa <= 0) warnings.push("INVALID_ABSOLUTE_PRESSURE");

  return {
    absolutePressureKPa: nextPressurePa / 1000,
    pressureRateKPaPerS,
    gasMoles: nextN,
    pumpThroughputM3PerS,
    pressureShockIndex: shockIndex,
    warnings,
  };
}
