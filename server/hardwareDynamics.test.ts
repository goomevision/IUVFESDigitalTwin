import { describe, expect, it } from 'vitest';
import { MachineDynamicsEngine } from './machineDynamics';
import { ClosedLoopSimulationEngine } from './closedLoopSimulation';
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

const vacuumCommand: MachineCommand = {
  heater: false,
  vacuumPump: true,
  extractor: false,
  cooling: false,
  condenser: false,
};

const target: MachineSensors = {
  ...initial,
  pressureMbar: 50,
  temperatureC: 60,
  yieldPercent: 100,
};

describe('virtual hardware coupling', () => {
  it('changes vacuum response when chamber volume changes', () => {
    const compact = new MachineDynamicsEngine(initial, { chamberVolumeL: 100, pumpCapacityM3h: 200 });
    const large = new MachineDynamicsEngine(initial, { chamberVolumeL: 500, pumpCapacityM3h: 200 });

    const compactFrame = compact.step(target, vacuumCommand, 1);
    const largeFrame = large.step(target, vacuumCommand, 1);

    expect(compactFrame.pressureMbar).toBeLessThan(largeFrame.pressureMbar);
  });

  it('changes thermal response when heating power or thermal mass changes', () => {
    const fast = new MachineDynamicsEngine(initial, { heatingPowerKW: 12, thermalMassKJPerC: 125 });
    const slow = new MachineDynamicsEngine(initial, { heatingPowerKW: 6, thermalMassKJPerC: 500 });
    const command: MachineCommand = { ...vacuumCommand, vacuumPump: false, heater: true };

    const fastFrame = fast.step(target, command, 1);
    const slowFrame = slow.step(target, command, 1);

    expect(fastFrame.temperatureC).toBeGreaterThan(slowFrame.temperatureC);
  });

  it('persists the hardware profile in a closed-loop snapshot', () => {
    const config = {
      targetPressureMbar: 50,
      targetTemperatureC: 60,
      materialWeightKg: 10,
      waterContentPercent: 20,
      oilContentPercent: 10,
      realTime: false,
      hardware: {
        chamberVolumeL: 400,
        pumpCapacityM3h: 150,
        thermalMassKJPerC: 350,
        heatingPowerKW: 8,
        coolingPowerKW: 2,
        leakRateMbarPerSecond: 0.1,
      },
    };
    const engine = new ClosedLoopSimulationEngine(config);
    const snapshot = engine.snapshot();

    expect(snapshot.config.hardware).toEqual(config.hardware);
    expect(snapshot.dynamics.config.chamberVolumeL).toBe(400);
    expect(snapshot.dynamics.config.pumpCapacityM3h).toBe(150);
  });

  it('rejects restore into a different hardware profile', () => {
    const base = {
      targetPressureMbar: 50,
      targetTemperatureC: 60,
      materialWeightKg: 10,
      waterContentPercent: 20,
      oilContentPercent: 10,
      realTime: false,
      hardware: {
        chamberVolumeL: 250,
        pumpCapacityM3h: 200,
        thermalMassKJPerC: 250,
        heatingPowerKW: 9,
        coolingPowerKW: 3,
        leakRateMbarPerSecond: 0,
      },
    };
    const snapshot = new ClosedLoopSimulationEngine(base).snapshot();
    const mismatched = new ClosedLoopSimulationEngine({
      ...base,
      hardware: { ...base.hardware, chamberVolumeL: 500 },
    });

    expect(() => mismatched.restore(snapshot)).toThrow('Snapshot hardware profile does not match simulation configuration');
  });
});
