import { describe, expect, it, vi } from 'vitest';
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

const target: MachineSensors = { ...initial, pressureMbar: 50, temperatureC: 60, yieldPercent: 100 };
const vacuum: MachineCommand = { vacuumPump: true, heater: false, extractor: false, cooling: false, condenser: false };

describe('virtual hardware coupling', () => {
  it('changes vacuum response with chamber volume', () => {
    const compact = new MachineDynamicsEngine(initial, { chamberVolumeL: 100, pumpCapacityM3h: 200 });
    const large = new MachineDynamicsEngine(initial, { chamberVolumeL: 500, pumpCapacityM3h: 200 });
    expect(compact.step(target, vacuum, 1).pressureMbar).toBeLessThan(large.step(target, vacuum, 1).pressureMbar);
  });

  it('changes thermal response with heating power and thermal mass', () => {
    const fast = new MachineDynamicsEngine(initial, { heatingPowerKW: 12, thermalMassKJPerC: 125 });
    const slow = new MachineDynamicsEngine(initial, { heatingPowerKW: 6, thermalMassKJPerC: 500 });
    const command: MachineCommand = { ...vacuum, vacuumPump: false, heater: true };
    expect(fast.step(target, command, 1).temperatureC).toBeGreaterThan(slow.step(target, command, 1).temperatureC);
  });

  it('persists and validates the hardware profile through snapshots', () => {
    const config = {
      targetPressureMbar: 50, targetTemperatureC: 60, materialWeightKg: 10,
      waterContentPercent: 20, oilContentPercent: 10, realTime: false,
      hardware: { chamberVolumeL: 400, pumpCapacityM3h: 150, thermalMassKJPerC: 350, heatingPowerKW: 8, coolingPowerKW: 2, leakRateMbarPerSecond: 0.1 },
    };
    const snapshot = new ClosedLoopSimulationEngine(config).snapshot();
    expect(snapshot.config.hardware).toEqual(config.hardware);
    const mismatched = new ClosedLoopSimulationEngine({ ...config, hardware: { ...config.hardware, chamberVolumeL: 500 } });
    expect(() => mismatched.restore(snapshot)).toThrow('Snapshot hardware profile does not match simulation configuration');
  });

  it('does not advance an interactive real-time step before the configured wall-clock interval', () => {
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(1_000_000);
    const engine = new ClosedLoopSimulationEngine({
      targetPressureMbar: 50,
      targetTemperatureC: 60,
      materialWeightKg: 10,
      waterContentPercent: 20,
      oilContentPercent: 10,
      dtSeconds: 1,
      realTime: true,
    });

    expect(engine.step()).not.toBeNull();
    const stepAfterFirst = engine.snapshot().stepNumber;
    expect(engine.step()).toBeNull();
    expect(engine.snapshot().stepNumber).toBe(stepAfterFirst);

    now.mockReturnValue(1_001_000);
    expect(engine.step()).not.toBeNull();
    expect(engine.snapshot().stepNumber).toBe(stepAfterFirst + 1);
    now.mockRestore();
  });

  it('records a wall-clock interval on accepted real-time frames', () => {
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(2_000_000);
    const engine = new ClosedLoopSimulationEngine({
      targetPressureMbar: 50,
      targetTemperatureC: 60,
      materialWeightKg: 10,
      waterContentPercent: 20,
      oilContentPercent: 10,
      dtSeconds: 2,
      realTime: true,
    });

    engine.step();
    now.mockReturnValue(2_002_000);
    const frame = engine.step();
    expect(frame?.wallClockDeltaMs).toBe(2000);
    expect(frame?.timestampSeconds).toBe(4);
    now.mockRestore();
  });
});
