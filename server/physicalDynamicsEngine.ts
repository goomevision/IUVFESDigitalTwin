export type MaterialThermalProperties = {
  heatCapacityJPerKgK: number;
  latentHeatJPerKg: number;
  vaporPressurePaAtTemperature: (temperatureK: number) => number;
};

export type VesselThermalProperties = {
  heatTransferWPerK: number;
  ambientTemperatureK: number;
};

export type PhysicalDynamicsInput = {
  temperatureK: number;
  pressurePaAbs: number;
  massKg: number;
  heaterPowerW: number;
  vessel: VesselThermalProperties;
  material: MaterialThermalProperties;
  vaporConductanceKgPerPaS: number;
};

export type PhysicalDynamicsStep = {
  temperatureK: number;
  pressurePaAbs: number;
  massKg: number;
  evaporatedMassKg: number;
  energyToVaporizeJ: number;
  vaporPressurePa: number;
};

function positiveFinite(name: string, value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be finite and non-negative.`);
  return value;
}

/**
 * A deliberately small, explicit dynamics kernel. It is a foundation for
 * plugging in authoritative property correlations and vessel geometry; it is
 * not a complete phase-equilibrium or pressure-vessel solver.
 */
export function advancePhysicalDynamics(input: PhysicalDynamicsInput, dtS: number): PhysicalDynamicsStep {
  if (!Number.isFinite(dtS) || dtS <= 0) throw new Error("dtS must be positive and finite.");
  positiveFinite("heaterPowerW", input.heaterPowerW);
  positiveFinite("massKg", input.massKg);
  positiveFinite("pressurePaAbs", input.pressurePaAbs);
  positiveFinite("heatCapacityJPerKgK", input.material.heatCapacityJPerKgK);
  positiveFinite("latentHeatJPerKg", input.material.latentHeatJPerKg);
  positiveFinite("heatTransferWPerK", input.vessel.heatTransferWPerK);
  positiveFinite("vaporConductanceKgPerPaS", input.vaporConductanceKgPerPaS);

  const vaporPressurePa = input.material.vaporPressurePaAtTemperature(input.temperatureK);
  if (!Number.isFinite(vaporPressurePa) || vaporPressurePa < 0) throw new Error("Material vapor-pressure correlation returned an invalid value.");

  const drivingPressurePa = Math.max(vaporPressurePa - input.pressurePaAbs, 0);
  const requestedEvaporationKg = input.vaporConductanceKgPerPaS * drivingPressurePa * dtS;
  const evaporatedMassKg = Math.min(Math.max(requestedEvaporationKg, 0), input.massKg);
  const energyToVaporizeJ = evaporatedMassKg * input.material.latentHeatJPerKg;

  const netHeatW = input.heaterPowerW - input.vessel.heatTransferWPerK * (input.temperatureK - input.vessel.ambientTemperatureK);
  const sensibleEnergyJ = netHeatW * dtS - energyToVaporizeJ;
  const thermalMassKg = Math.max(input.massKg, 1e-12);
  const deltaTemperatureK = sensibleEnergyJ / (thermalMassKg * input.material.heatCapacityJPerKgK);
  const temperatureK = Math.max(0, input.temperatureK + deltaTemperatureK);
  const massKg = Math.max(0, input.massKg - evaporatedMassKg);

  // Ideal-gas-like pressure update is intentionally marked as a placeholder:
  // geometry and vapor composition must be supplied by the production solver.
  const pressurePaAbs = Math.max(0, input.pressurePaAbs + (evaporatedMassKg * 8.314 * temperatureK / 0.018));

  return {
    temperatureK,
    pressurePaAbs,
    massKg,
    evaporatedMassKg,
    energyToVaporizeJ,
    vaporPressurePa,
  };
}
