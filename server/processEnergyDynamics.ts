export type EquipmentPower = {
  heaterW: number;
  vacuumPumpW: number;
  vibrationW?: number;
  controlsW?: number;
  heaterEfficiency?: number;
  pumpEfficiency?: number;
};

export type ThermalSystem = {
  materialMassKg: number;
  materialCpJPerKgK: number;
  vesselMassKg: number;
  vesselCpJPerKgK: number;
  ambientTemperatureC: number;
  heatLossCoefficientWPerK: number;
};

export type EnergyStep = {
  physicalTimeS: number;
  dtS: number;
  inputPowerW: number;
  effectiveHeatingPowerW: number;
  heatLossW: number;
  deltaTemperatureC: number;
  cumulativeEnergyWh: number;
};

export function simulateThermalPowerStep(
  stateTemperatureC: number,
  power: EquipmentPower,
  thermal: ThermalSystem,
  dtS: number,
  cumulativeEnergyWh = 0,
): EnergyStep {
  if (dtS <= 0) throw new Error("dtS must be positive.");
  if (thermal.materialMassKg <= 0 || thermal.vesselMassKg < 0) throw new Error("Invalid thermal mass.");
  const inputPowerW = Math.max(0, power.heaterW) + Math.max(0, power.vacuumPumpW) + Math.max(0, power.vibrationW ?? 0) + Math.max(0, power.controlsW ?? 0);
  const heaterEfficiency = Math.min(1, Math.max(0, power.heaterEfficiency ?? 1));
  const effectiveHeatingPowerW = Math.max(0, power.heaterW) * heaterEfficiency;
  const heatLossW = Math.max(0, thermal.heatLossCoefficientWPerK) * Math.max(0, stateTemperatureC - thermal.ambientTemperatureC);
  const thermalCapacityJPerK = thermal.materialMassKg * thermal.materialCpJPerKgK + thermal.vesselMassKg * thermal.vesselCpJPerKgK;
  const deltaTemperatureC = ((effectiveHeatingPowerW - heatLossW) * dtS) / thermalCapacityJPerK;
  return { physicalTimeS: dtS, dtS, inputPowerW, effectiveHeatingPowerW, heatLossW, deltaTemperatureC, cumulativeEnergyWh: cumulativeEnergyWh + (inputPowerW * dtS) / 3600 };
}
