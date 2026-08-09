export type FishMatrixState = {
  materialId: string;
  totalMassKg: number;
  moistureKg: number;
  lipidKg: number;
  proteinKg?: number;
  temperatureC: number;
  absolutePressurePa: number;
  waterActivity?: number;
  recoveredOilKg: number;
  dryFishMassKg: number;
};

export type FishProcessStep = {
  physicalTimeS: number;
  state: FishMatrixState;
  heaterPowerW: number;
  vacuumPumpPowerW: number;
  energyWh: number;
};

export function recordFishProcessStep(
  previous: FishMatrixState,
  next: FishMatrixState,
  physicalTimeS: number,
  heaterPowerW: number,
  vacuumPumpPowerW: number,
  energyWh: number,
): FishProcessStep {
  if (physicalTimeS < 0 || energyWh < 0 || heaterPowerW < 0 || vacuumPumpPowerW < 0) throw new Error("Invalid process accounting values.");
  if (next.totalMassKg < 0 || next.moistureKg < 0 || next.lipidKg < 0 || next.recoveredOilKg < 0 || next.dryFishMassKg < 0) throw new Error("Fish mass states cannot be negative.");
  return { physicalTimeS, state: { ...next }, heaterPowerW, vacuumPumpPowerW, energyWh };
}

export function calculateFishMassBalance(state: FishMatrixState): number {
  return state.moistureKg + state.lipidKg + (state.proteinKg ?? 0) + state.dryFishMassKg;
}
