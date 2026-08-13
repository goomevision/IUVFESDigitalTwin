import { describe, expect, it } from 'vitest';
import { ClosedLoopSimulationEngine } from './closedLoopSimulation';

const config = {
  targetPressureMbar: 100,
  targetTemperatureC: 70,
  materialWeightKg: 10,
  waterContentPercent: 20,
  oilContentPercent: 5,
  dtSeconds: 1,
  maxSteps: 1000,
};

describe('ClosedLoopSimulationEngine', () => {
  it('does not evolve state while paused', () => {
    const engine = new ClosedLoopSimulationEngine(config);
    const first = engine.step();
    expect(first).not.toBeNull();
    const before = engine.getSensors();

    engine.pause();
    expect(engine.step()).toBeNull();
    expect(engine.step()).toBeNull();

    expect(engine.getSensors()).toEqual(before);
    expect(engine.getFrames()).toHaveLength(1);
    expect(engine.isPaused()).toBe(true);
  });

  it('resumes from the exact state at pause', () => {
    const engine = new ClosedLoopSimulationEngine(config);
    engine.step();
    const pausedAt = engine.getSensors();
    engine.pause();
    engine.step();
    engine.resume();

    const resumed = engine.step();
    expect(resumed).not.toBeNull();
    expect(resumed!.sensorBefore).toEqual(pausedAt);
    expect(resumed!.timestampSeconds).toBe(2);
  });

  it('records a causally ordered controller-before and controller-after state', () => {
    const engine = new ClosedLoopSimulationEngine(config);
    const first = engine.step();
    expect(first).not.toBeNull();
    expect(first!.controller.stage).toBe('CHARGE');
    expect(first!.controllerAfterActuation.stage).toBe('VACUUM');
    expect(first!.effectiveCommands.vacuumPump).toBe(false);

    const second = engine.step();
    expect(second).not.toBeNull();
    expect(second!.controller.stage).toBe('VACUUM');
    expect(second!.effectiveCommands.vacuumPump).toBe(true);
    expect(second!.actuatorLevels.vacuumPump).toBe(1);
    expect(second!.sensorBefore.pressureMbar).toBeGreaterThanOrEqual(second!.sensorAfter.pressureMbar);
  });

  it('matches deterministic vacuum pressure and energy at the first active pump step', () => {
    const engine = new ClosedLoopSimulationEngine(config);
    engine.step();
    const frame = engine.step();
    expect(frame).not.toBeNull();
    expect(frame!.sensorBefore.pressureMbar).toBe(1013.25);
    expect(frame!.sensorAfter.pressureMbar).toBeCloseTo(1010.8, 10);
    expect(frame!.sensorAfter.temperatureC).toBe(25);
    expect(frame!.sensorAfter.energyKwh).toBeCloseTo(0.0015, 12);
  });

  it('preserves continuous actuator limits in the physical model', () => {
    const engine = new ClosedLoopSimulationEngine({
      ...config,
      hardware: { heatingPowerKw: 9 },
    });
    const snapshot = engine.snapshot();
    snapshot.state.stage = 'HEAT_UP';
    snapshot.state.sensors = { ...snapshot.state.sensors, pressureMbar: 100, temperatureC: 25 };
    snapshot.dynamics.state = { ...snapshot.dynamics.state, pressureMbar: 100, temperatureC: 25 };
    snapshot.sensors = { ...snapshot.sensors, pressureMbar: 100, temperatureC: 25 };
    engine.restore(snapshot);
    engine.setOperatorLimits({ heaterMax: 0.5 });

    const frame = engine.step();
    expect(frame).not.toBeNull();
    expect(frame!.actuatorLevels.heater).toBeCloseTo(0.5, 12);
    expect(frame!.hardwareDiagnostics.heatingPowerKw).toBe(9);
    expect(frame!.sensorAfter.energyKwh).toBeCloseTo(0.00275, 12);
  });

  it('matches the closed-form vacuum baseline at frame 138', () => {
    const engine = new ClosedLoopSimulationEngine(config);
    for (let i = 0; i < 138; i += 1) engine.step();
    const frame = engine.getFrames().at(-1)!;
    expect(frame.step).toBe(138);
    expect(frame.timestampSeconds).toBe(138);
    expect(frame.sensorAfter.pressureMbar).toBeCloseTo(677.6, 10);
    expect(frame.sensorAfter.temperatureC).toBe(25);
    expect(frame.sensorAfter.yieldPercent).toBe(0);
    expect(frame.sensorAfter.waterRemovedKg).toBe(0);
    expect(frame.sensorAfter.oilRecoveredKg).toBe(0);
    expect(frame.sensorAfter.energyKwh).toBeCloseTo(0.2055, 12);
  });

  it('reset returns the machine to deterministic initial conditions', () => {
    const engine = new ClosedLoopSimulationEngine(config);
    engine.step();
    engine.pause();
    engine.reset();

    expect(engine.isPaused()).toBe(false);
    expect(engine.getFrames()).toHaveLength(0);
    expect(engine.getSensors()).toEqual({
      chamberSealed: true,
      pressureMbar: 1013.25,
      temperatureC: 25,
      yieldPercent: 0,
      waterRemovedKg: 0,
      oilRecoveredKg: 0,
      energyKwh: 0,
    });
  });
});
