import { ClosedLoopSimulationEngine, type CausalFrame, type ClosedLoopSimulationConfig } from './closedLoopSimulation';

export type GoldenPatchouliRow = {
  tSeconds: number;
  temperatureC: number;
  pressureMbar: number;
  massKg: number;
  waterKg: number;
  vaporKg: number;
  condensateWaterKg: number;
  oilInMatrixKg: number;
  oilVaporKg: number;
  recoveredOilKg: number;
  volatileLossKg: number;
  latentHeatLoadKW: number;
  latentHeatEnergyKWh: number;
  energyKWh: number;
  flowRegime?: string;
  knudsenNumber?: number;
  meanFreePathM?: number;
  massBalanceResidualKg: number;
  energyBalanceResidualKWh: number;
  safetyStatus: string;
};

export type GoldenPatchouliDataset = {
  datasetId: string;
  materialId: 'patchouli';
  modelRevision: string;
  assumptions: Record<string, string | number>;
  rows: GoldenPatchouliRow[];
};

/**
 * Deterministic golden-case adapter. It deliberately uses explicit baseline
 * inputs and preserves every causal frame. It is a regression dataset, not
 * experimental truth and not a validated production recipe.
 */
export function runGoldenPatchouliExperiment(overrides: Partial<ClosedLoopSimulationConfig> = {}): GoldenPatchouliDataset {
  const config: ClosedLoopSimulationConfig = {
    targetPressureMbar: 80,
    targetTemperatureC: 55,
    materialWeightKg: 10,
    waterContentPercent: 65,
    oilContentPercent: 3,
    dtSeconds: 1,
    maxSteps: 600,
    realTime: false,
    hardware: {
      chamberVolumeL: 250,
      pumpCapacityM3h: 200,
      thermalMassKJPerC: 250,
      heatingPowerKW: 9,
      coolingPowerKW: 3,
      vacuumLineConductanceFactor: 1,
      vacuumLineDiameterM: 0.02,
      leakRateMbarPerSecond: 0,
    },
    ...overrides,
  };
  const engine = new ClosedLoopSimulationEngine(config);
  const result = engine.runToCompletion();
  return {
    datasetId: 'GOLDEN-PATCHOULI-V1',
    materialId: 'patchouli',
    modelRevision: 'closed-loop-physics-integration-v1',
    assumptions: {
      purpose: 'deterministic regression baseline',
      temperatureTargetC: config.targetTemperatureC,
      pressureTargetMbar: config.targetPressureMbar,
      dtSeconds: config.dtSeconds ?? 1,
      notValidatedExperimentalTruth: 1,
    },
    rows: result.frames.map(toGoldenRow),
  };
}

function toGoldenRow(frame: CausalFrame): GoldenPatchouliRow {
  const m = frame.materialInventory as any;
  const safetyStatus = frame.safety.severity === 'CRITICAL' ? 'FAULT' : frame.safety.severity;
  return {
    tSeconds: frame.timestampSeconds,
    temperatureC: frame.sensorAfter.temperatureC,
    pressureMbar: frame.sensorAfter.pressureMbar,
    massKg: Number(m.totalTrackedMassKg ?? 0),
    waterKg: Number(m.moistureKg ?? 0),
    vaporKg: Number(m.vaporKg ?? 0),
    condensateWaterKg: Number(m.condensateWaterKg ?? 0),
    oilInMatrixKg: Number(m.oilInMatrixKg ?? 0),
    oilVaporKg: Number(m.oilVaporKg ?? 0),
    recoveredOilKg: Number(m.recoveredOilKg ?? 0),
    volatileLossKg: Number(m.volatileLossKg ?? 0),
    latentHeatLoadKW: Number(m.latentHeatLoadKW ?? 0),
    latentHeatEnergyKWh: Number(m.latentHeatEnergyKWh ?? 0),
    energyKWh: frame.sensorAfter.energyKwh,
    flowRegime: m.flowRegime,
    knudsenNumber: m.knudsenNumber,
    meanFreePathM: m.meanFreePathM,
    massBalanceResidualKg: Number(m.massBalanceResidualKg ?? 0),
    energyBalanceResidualKWh: Number(m.energyBalanceResidualKWh ?? 0),
    safetyStatus,
  };
}
