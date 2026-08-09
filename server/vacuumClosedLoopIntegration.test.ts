import { describe, expect, it } from 'vitest';
import { MachineDynamicsEngine } from './machineDynamics';
import type { MachineCommand, MachineSensors } from './processStateEngine';

const initial: MachineSensors = {
  chamberSealed: true,
  pressureMbar: 1013.25,
  temperatureC: 25,
  yieldPercent: 0,
  waterRemovedKg: 0,
  oilRecoveredKg: 0,
  energyKwh: 0,
};

const target: MachineSensors = { ...initial, pressureMbar: 100, temperatureC: 60, yieldPercent: 100 };
const pumpCommand: MachineCommand = { vacuumPump: true, heater: false, extractor: false, condenser: false, cooling: false };

describe('closed-loop vacuum coupling', () => {
  it('responds to line conductance', () => {
    const unrestricted = new MachineDynamicsEngine(initial, { chamberVolumeL: 250, pumpCapacityM3h: 200, vacuumLineConductanceFactor: 1 });
    const restricted = new MachineDynamicsEngine(initial, { chamberVolumeL: 250, pumpCapacityM3h: 200, vacuumLineConductanceFactor: 0.1 });

    const fast = unrestricted.step(target, pumpCommand, 1, 0, 0).pressureMbar;
    const slow = restricted.step(target, pumpCommand, 1, 0, 0).pressureMbar;

    expect(fast).toBeLessThan(slow);
  });

  it('generated vapor opposes evacuation when the pump is active', () => {
    const dry = new MachineDynamicsEngine(initial, { chamberVolumeL: 250, pumpCapacityM3h: 200, vacuumLineConductanceFactor: 1 });
    const vapor = new MachineDynamicsEngine(initial, { chamberVolumeL: 250, pumpCapacityM3h: 200, vacuumLineConductanceFactor: 1 });

    const dryPressure = dry.step(target, pumpCommand, 1, 0, 0).pressureMbar;
    const vaporPressure = vapor.step(target, pumpCommand, 1, 0, 0.02).pressureMbar;

    expect(vaporPressure).toBeGreaterThan(dryPressure);
  });
});
