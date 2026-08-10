import { describe, expect, it } from 'vitest';
import { MachineDynamicsEngine } from './machineDynamics';
import type { MachineCommand, MachineSensors } from './processStateEngine';

const initial: MachineSensors = {
  chamberSealed: true,
  pressureMbar: 100,
  temperatureC: 80,
  yieldPercent: 20,
  waterRemovedKg: 0,
  oilRecoveredKg: 0,
  energyKwh: 0,
  coldTrapCondensedWaterKg: 0,
  collectionVesselMassKg: [0, 0, 0, 0],
  unroutedCondensateKg: 0,
};

const target: MachineSensors = {
  ...initial,
  pressureMbar: 50,
  temperatureC: 80,
  yieldPercent: 100,
  waterRemovedKg: 1,
  oilRecoveredKg: 1,
};

const commands: MachineCommand = {
  vacuumPump: true,
  heater: false,
  extractor: true,
  cooling: false,
  condenser: true,
};

describe('machine dynamics collection coupling', () => {
  it('keeps collection vessels in the causal sensor state', () => {
    const engine = new MachineDynamicsEngine(initial, {
      chamberVolumeL: 250,
      pumpCapacityM3h: 200,
      coldTrapHeatTransferCoefficientWPerM2K: 100,
      coldTrapHeatTransferAreasM2: [1, 1, 1, 1],
      coldTrapTemperaturesC: [0, -20, -40, -80],
      coldTrapVolumesL: [2, 2, 2, 2],
      coldTrapCondensateCapacityKg: [2, 2, 2, 2],
      collectionVesselCapacityKg: [2, 2, 2, 2],
      oilCollectionRoutingFractions: [0, 1, 0],
      ultrasonicRequestedPowerKW: 0,
    });

    const next = engine.step(target, commands, 1);
    expect(next.collectionVesselMassKg).toBeDefined();
    expect(next.collectionVesselMassKg?.reduce((sum, value) => sum + value, 0)).toBeGreaterThan(0);
    expect(next.unroutedCondensateKg).toBeGreaterThanOrEqual(0);
    expect(next.collectionRoutingStatus).toBeDefined();
  });
});
