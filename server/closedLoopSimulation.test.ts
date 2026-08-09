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
