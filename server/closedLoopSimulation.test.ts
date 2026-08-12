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

  it('records the causal sensor -> controller -> actuator -> sensor chain', () => {
    const engine = new ClosedLoopSimulationEngine(config);
    const frame = engine.step();
    expect(frame).not.toBeNull();
    expect(frame!.controller.commands).toBeDefined();
    expect(frame!.sensorAfter).toBeDefined();
    expect(frame!.sensorBefore.pressureMbar).toBeGreaterThanOrEqual(frame!.sensorAfter.pressureMbar);
  });

  it('actuator limits materially change the next physical frame', () => {
    const unrestricted = new ClosedLoopSimulationEngine(config);
    const limited = new ClosedLoopSimulationEngine(config);

    const unrestrictedSnapshot = unrestricted.snapshot();
    const limitedSnapshot = limited.snapshot();
    unrestrictedSnapshot.state.stage = 'HEAT_UP';
    limitedSnapshot.state.stage = 'HEAT_UP';
    unrestrictedSnapshot.state.sensors = { ...unrestrictedSnapshot.state.sensors, pressureMbar: 100, temperatureC: 25 };
    limitedSnapshot.state.sensors = { ...limitedSnapshot.state.sensors, pressureMbar: 100, temperatureC: 25 };
    unrestrictedSnapshot.dynamics.state = { ...unrestrictedSnapshot.dynamics.state, pressureMbar: 100, temperatureC: 25 };
    limitedSnapshot.dynamics.state = { ...limitedSnapshot.dynamics.state, pressureMbar: 100, temperatureC: 25 };
    unrestrictedSnapshot.sensors = { ...unrestrictedSnapshot.sensors, pressureMbar: 100, temperatureC: 25 };
    limitedSnapshot.sensors = { ...limitedSnapshot.sensors, pressureMbar: 100, temperatureC: 25 };

    unrestricted.restore(unrestrictedSnapshot);
    limited.restore(limitedSnapshot);
    limited.setOperatorLimits({ heaterMax: 0 });

    const unrestrictedFrame = unrestricted.step();
    const limitedFrame = limited.step();

    expect(unrestrictedFrame).not.toBeNull();
    expect(limitedFrame).not.toBeNull();
    expect(unrestrictedFrame!.effectiveCommands.heater).toBe(true);
    expect(limitedFrame!.effectiveCommands.heater).toBe(false);
    expect(unrestrictedFrame!.sensorAfter.temperatureC).toBeGreaterThan(limitedFrame!.sensorAfter.temperatureC);
  });

  it('restores an exact snapshot and continues deterministically', () => {
    const original = new ClosedLoopSimulationEngine(config);
    original.step();
    original.step();
    const snapshot = original.snapshot();

    const restored = new ClosedLoopSimulationEngine(config);
    restored.restore(snapshot);

    const originalNext = original.step();
    const restoredNext = restored.step();

    expect(restoredNext).toEqual(originalNext);
    expect(restored.getSensors()).toEqual(original.getSensors());
    expect(restored.getFrames()).toEqual(original.getFrames());
  });

  it('trips the safety interlock when restored state is over temperature', () => {
    const engine = new ClosedLoopSimulationEngine(config);
    const snapshot = engine.snapshot();
    snapshot.sensors.temperatureC = 150;
    snapshot.state.sensors.temperatureC = 150;
    snapshot.dynamics.state.temperatureC = 150;

    engine.restore(snapshot);
    const frame = engine.step();

    expect(frame).not.toBeNull();
    expect(frame!.safety.stage).toBe('FAULT');
    expect(frame!.safety.overTemperature).toBe(true);
    expect(frame!.effectiveCommands.heater).toBe(false);
    expect(frame!.safety.alarm).toContain('OVER_TEMPERATURE');
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
