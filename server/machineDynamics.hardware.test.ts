import { describe, expect, it } from 'vitest';
import { MachineDynamicsEngine } from './machineDynamics';
import type { MachineSensors } from './processStateEngine';

const initial: MachineSensors = {
  chamberSealed: true,
  pressureMbar: 1013.25,
  temperatureC: 25,
  yieldPercent: 0,
  waterRemovedKg: 0,
  oilRecoveredKg: 0,
  energyKwh: 0,
};

const target: MachineSensors = {
  ...initial,
  pressureMbar: 200,
  temperatureC: 60,
  yieldPercent: 100,
  waterRemovedKg: 2,
  oilRecoveredKg: 0.5,
};

const vacuumCommand = {
  chamberSealed: true,
  heater: false,
  cooling: false,
  condenser: false,
  extractor: false,
  vacuumPump: true,
};

describe('MachineDynamics virtual hardware coupling', () => {
  it('changes vacuum response when connected volume and pump capacity change', () => {
    const smallFast = new MachineDynamicsEngine(initial, {
      chamberVolumeL: 100,
      pumpCapacityM3h: 300,
      thermalMassKJPerC: 100,
      heatingPowerKW: 8,
      coolingPowerKW: 4,
      leakRateMbarPerSecond: 0,
    });
    const largeSlow = new MachineDynamicsEngine(initial, {
      chamberVolumeL: 500,
      pumpCapacityM3h: 100,
      thermalMassKJPerC: 100,
      heatingPowerKW: 8,
      coolingPowerKW: 4,
      leakRateMbarPerSecond: 0,
    });

    const fast = smallFast.step(target, vacuumCommand, 1);
    const slow = largeSlow.step(target, vacuumCommand, 1);

    expect(fast.pressureMbar).toBeLessThan(slow.pressureMbar);
  });

  it('models leak/load as a pressure rise rather than silently ignoring it', () => {
    const sealed = new MachineDynamicsEngine(initial, {
      chamberVolumeL: 250,
      pumpCapacityM3h: 200,
      thermalMassKJPerC: 100,
      heatingPowerKW: 8,
      coolingPowerKW: 4,
      leakRateMbarPerSecond: 0,
    });
    const leaking = new MachineDynamicsEngine(initial, {
      chamberVolumeL: 250,
      pumpCapacityM3h: 200,
      thermalMassKJPerC: 100,
      heatingPowerKW: 8,
      coolingPowerKW: 4,
      leakRateMbarPerSecond: 20,
    });

    const sealedFrame = sealed.step(target, vacuumCommand, 1);
    const leakingFrame = leaking.step(target, vacuumCommand, 1);

    expect(leakingFrame.pressureMbar).toBeGreaterThan(sealedFrame.pressureMbar);
  });

  it('changes thermal response when thermal mass and heater power change', () => {
    const lowMass = new MachineDynamicsEngine(initial, {
      chamberVolumeL: 250,
      pumpCapacityM3h: 200,
      thermalMassKJPerC: 50,
      heatingPowerKW: 12,
      coolingPowerKW: 4,
      leakRateMbarPerSecond: 0,
    });
    const highMass = new MachineDynamicsEngine(initial, {
      chamberVolumeL: 250,
      pumpCapacityM3h: 200,
      thermalMassKJPerC: 300,
      heatingPowerKW: 6,
      coolingPowerKW: 4,
      leakRateMbarPerSecond: 0,
    });

    const command = { ...vacuumCommand, vacuumPump: false, heater: true };
    const fastHeat = lowMass.step(target, command, 1);
    const slowHeat = highMass.step(target, command, 1);

    expect(fastHeat.temperatureC).toBeGreaterThan(slowHeat.temperatureC);
  });
});