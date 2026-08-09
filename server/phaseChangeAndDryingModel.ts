export type PhaseState = "LIQUID" | "ICE" | "VAPOR" | "MIXED";

export type DryingMaterialState = {
  materialId: string;
  massKg: number;
  moistureKg: number;
  lipidKg: number;
  temperatureC: number;
  absolutePressurePa: number;
  phaseState: PhaseState;
  addedWaterKg: number;
  intrinsicMoistureKg: number;
  porosity?: number;
  permeability?: number;
};

export type ProcessObservation = {
  physicalTimeS: number;
  state: DryingMaterialState;
  evaporatedWaterKg: number;
  recoveredOilKg: number;
};

export type DryingProcessResult = {
  finalState: DryingMaterialState;
  observations: ProcessObservation[];
  warnings: string[];
};

/**
 * State-transition contract for vacuum drying / freeze-drying / lipid release.
 * This is deliberately conservative: it records state and bookkeeping but
 * does not claim a universal kinetic law for biological tissues.
 */
export function buildDryingProcessObservation(
  previous: DryingMaterialState,
  next: DryingMaterialState,
  physicalTimeS: number,
): ProcessObservation {
  if (physicalTimeS < 0) throw new Error("Physical time cannot be negative.");
  const evaporatedWaterKg = Math.max(0, previous.moistureKg - next.moistureKg);
  const recoveredOilKg = Math.max(0, previous.lipidKg - next.lipidKg);
  if (next.massKg < 0 || next.moistureKg < 0 || next.lipidKg < 0) throw new Error("Mass state cannot be negative.");
  return { physicalTimeS, state: { ...next }, evaporatedWaterKg, recoveredOilKg };
}

export function classifyDryingMode(state: DryingMaterialState): "VACUUM_DRYING" | "FREEZE_DRYING" | "UNDEFINED" {
  if (state.phaseState === "ICE" && state.absolutePressurePa > 0) return "FREEZE_DRYING";
  if (state.absolutePressurePa < 101325 && state.temperatureC >= 0) return "VACUUM_DRYING";
  return "UNDEFINED";
}
