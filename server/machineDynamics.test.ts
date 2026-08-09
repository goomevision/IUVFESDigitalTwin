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
  pressureMbar: 100,
  temperatureC: 80,
  yieldPercent: 90,
  waterRemovedKg: 2,
  oilRecoveredKg: 0.5,
  energyKwh: 3,
};

describe('MachineDynamicsEngine', () => {
  it('reduces pressure when the vacuum pump is active', () => {
    const engine = new MachineDynamicsEngine(initial, { vacuumRateMbarPerSecond: 8 });
    const next = engine.step(target, { vacuumPump: true, heater: false, extractor: false, condenser: false, cooling: false }, 20);
    expect(next.pressureMbar).toBeLessThan(initial.pressureMbar);
  });

  it('raises temperature when the heater is active', () => {
    const engine = new MachineDynamicsEngine(initial, { heaterRateCPerSecond: 0.5 });
    const next = engine.step(target, { vacuumPump: false, heater: true, extractor: false, condenser: false, cooling: false }, 20);
    expect(next.temperatureC).toBeGreaterThan(initial.temperatureC);
  });

  it('cooling and condenser oppose heating', () => {
    const hot = { ...initial, temperatureC: 90 };
    const engine = new MachineDynamicsEngine(hot, { coolingRateCPerSecond: 1, condenserCoolingFactor: 0.2 });
    const next = engine.step(target, { vacuumPump: false, heater: false, extractor: false, condenser: true, cooling: true }, 10);
    expect(next.temperatureC).toBeLessThan(hot.temperatureC);
  });
});
