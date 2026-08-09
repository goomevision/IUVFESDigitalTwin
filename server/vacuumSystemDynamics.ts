export type VacuumState = {
  pressureKPaAbs: number;
  gasMassKg: number;
  vaporMassKg: number;
};

export type VacuumSystemParameters = {
  vesselVolumeM3: number;
  effectivePumpSpeedM3PerS: number;
  leakRateKgPerS: number;
  gasConstantJPerKgK: number;
  temperatureK: number;
  minAbsolutePressureKPa: number;
};

export type VacuumStepResult = {
  state: VacuumState;
  pressureRateKPaPerS: number;
  pumpedMassKg: number;
  leakedMassKg: number;
  warnings: string[];
};

/**
 * Reduced-order ideal-gas vacuum dynamics. This is a screening model, not a
 * pressure-vessel design solver. Pump speed is represented as an effective
 * volumetric speed and leakage as an explicit mass source.
 */
export function advanceVacuumState(
  state: VacuumState,
  parameters: VacuumSystemParameters,
  dtS: number,
): VacuumStepResult {
  if (dtS <= 0) throw new Error("dtS must be positive.");
  if (parameters.vesselVolumeM3 <= 0 || parameters.effectivePumpSpeedM3PerS < 0) {
    throw new Error("Vessel volume must be positive and pump speed cannot be negative.");
  }
  if (parameters.temperatureK <= 0 || parameters.gasConstantJPerKgK <= 0) {
    throw new Error("Temperature and gas constant must be positive.");
  }

  const totalMass = Math.max(0, state.gasMassKg + state.vaporMassKg);
  const pumpFraction = Math.min(1, (parameters.effectivePumpSpeedM3PerS / parameters.vesselVolumeM3) * dtS);
  const pumpedMass = totalMass * pumpFraction;
  const leakedMass = Math.max(0, parameters.leakRateKgPerS * dtS);
  const nextTotalMass = Math.max(0, totalMass - pumpedMass + leakedMass);
  const nextGasMass = Math.max(0, state.gasMassKg - state.gasMassKg * pumpFraction + leakedMass);
  const nextVaporMass = Math.max(0, nextTotalMass - nextGasMass);
  const pressurePa = (nextTotalMass * parameters.gasConstantJPerKgK * parameters.temperatureK) / parameters.vesselVolumeM3;
  const nextPressureKPa = Math.max(parameters.minAbsolutePressureKPa, pressurePa / 1000);
  const pressureRate = (nextPressureKPa - state.pressureKPaAbs) / dtS;
  const warnings: string[] = [];

  if (nextPressureKPa <= parameters.minAbsolutePressureKPa) warnings.push("MINIMUM_ABSOLUTE_PRESSURE_REACHED");
  if (leakedMass > pumpedMass) warnings.push("LEAKAGE_EXCEEDS_PUMPED_MASS");

  return {
    state: {
      pressureKPaAbs: nextPressureKPa,
      gasMassKg: nextGasMass,
      vaporMassKg: nextVaporMass,
    },
    pressureRateKPaPerS: pressureRate,
    pumpedMassKg: pumpedMass,
    leakedMassKg: leakedMass,
    warnings,
  };
}
