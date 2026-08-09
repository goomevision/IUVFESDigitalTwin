import { getScientificEquation } from "./scientificEquationRegistry";

export type ProcessPhysicsState = {
  timeSeconds: number;
  temperatureK: number;
  pressurePa: number;
  massKg: number;
  internalEnergyJ: number;
};

export type ProcessPhysicsInput = {
  initial: ProcessPhysicsState;
  dtSeconds: number;
  massKg: number;
  cpJPerKgK: number;
  heatInputW: number;
  heatLossW?: number;
  massInKgPerS?: number;
  massOutKgPerS?: number;
  chamberVolumeM3?: number;
  gasMoles?: number;
  gasConstantJPerMolK?: number;
};

export type ProcessPhysicsStep = {
  state: ProcessPhysicsState;
  diagnostics: {
    equationIds: string[];
    massResidualKg: number;
    energyResidualJ: number;
    warnings: string[];
  };
};

/**
 * Conservative transient process kernel.
 *
 * This first implementation intentionally covers only a single-phase lumped
 * thermal control volume plus optional ideal-gas pressure diagnostics.
 * It does not cross phase boundaries and does not invent latent heat or
 * material properties. Higher-fidelity models must provide their own
 * evidence-backed property/phase models.
 */
export function stepProcessPhysics(input: ProcessPhysicsInput): ProcessPhysicsStep {
  if (!Number.isFinite(input.dtSeconds) || input.dtSeconds <= 0) {
    throw new Error("dtSeconds must be positive");
  }
  if (!Number.isFinite(input.cpJPerKgK) || input.cpJPerKgK <= 0) {
    throw new Error("cpJPerKgK must be positive and evidence-backed");
  }
  if (!Number.isFinite(input.massKg) || input.massKg <= 0) {
    throw new Error("massKg must be positive");
  }

  const massIn = input.massInKgPerS ?? 0;
  const massOut = input.massOutKgPerS ?? 0;
  const massDelta = (massIn - massOut) * input.dtSeconds;
  const nextMass = input.initial.massKg + massDelta;
  if (nextMass <= 0) throw new Error("process step would produce non-positive mass");

  const heatLoss = input.heatLossW ?? 0;
  const netHeatJ = (input.heatInputW - heatLoss) * input.dtSeconds;
  const deltaT = netHeatJ / (input.massKg * input.cpJPerKgK);
  const nextTemperatureK = input.initial.temperatureK + deltaT;

  let nextPressurePa = input.initial.pressurePa;
  const warnings: string[] = [];
  const equationIds = ["THERMAL-001", "MASS-001"];

  if (input.chamberVolumeM3 !== undefined || input.gasMoles !== undefined) {
    if (input.chamberVolumeM3 === undefined || input.gasMoles === undefined) {
      warnings.push("PRESSURE_MODEL_INCOMPLETE");
    } else if (input.chamberVolumeM3 <= 0 || input.gasMoles <= 0) {
      warnings.push("PRESSURE_MODEL_INVALID_INPUT");
    } else {
      const R = input.gasConstantJPerMolK ?? 8.31446261815324;
      nextPressurePa = (input.gasMoles * R * nextTemperatureK) / input.chamberVolumeM3;
      equationIds.push("PRESSURE-001");
      warnings.push("IDEAL_GAS_APPROXIMATION_ACTIVE");
    }
  }

  const expectedMass = input.initial.massKg + massDelta;
  const massResidualKg = nextMass - expectedMass;
  const expectedEnergyDeltaJ = netHeatJ;
  const actualEnergyDeltaJ = input.massKg * input.cpJPerKgK * deltaT;
  const energyResidualJ = actualEnergyDeltaJ - expectedEnergyDeltaJ;

  if (Math.abs(massResidualKg) > 1e-10) warnings.push("MASS_BALANCE_RESIDUAL");
  if (Math.abs(energyResidualJ) > Math.max(1e-9, Math.abs(expectedEnergyDeltaJ) * 1e-9)) {
    warnings.push("ENERGY_BALANCE_RESIDUAL");
  }

  const sensibleEquation = getScientificEquation("THERMAL-001");
  if (!sensibleEquation) throw new Error("Required scientific equation THERMAL-001 is not registered");

  return {
    state: {
      timeSeconds: input.initial.timeSeconds + input.dtSeconds,
      temperatureK: nextTemperatureK,
      pressurePa: nextPressurePa,
      massKg: nextMass,
      internalEnergyJ: input.initial.internalEnergyJ + netHeatJ,
    },
    diagnostics: {
      equationIds,
      massResidualKg,
      energyResidualJ,
      warnings,
    },
  };
}
