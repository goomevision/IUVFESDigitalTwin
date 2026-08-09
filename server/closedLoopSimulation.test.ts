import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { ClosedLoopSimulationEngine } from './closedLoopSimulation';

const config = {
  targetPressureMbar: 200,
  targetTemperatureC: 60,
  materialWeightKg: 10,
  waterContentPercent: 20,
  oilContentPercent: 5,
  dtSeconds: 1,
  maxSteps: 100,
};

describe('closed-loop real-time pacing', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not advance a real-time step before its wall-clock duration has elapsed', () => {
    vi.setSystemTime(new Date('2026-08-09T00:00:00.000Z'));
    const engine = new ClosedLoopSimulationEngine({ ...config, realTime: true });
    expect(engine.step()).not.toBeNull(); expect(engine.step()).toBeNull();
    vi.advanceTimersByTime(999); expect(engine.step()).toBeNull();
    vi.advanceTimersByTime(1); expect(engine.step()).not.toBeNull();
  });

  it('preserves the wall-clock gate across snapshot restore', () => {
    vi.setSystemTime(new Date('2026-08-09T00:00:00.000Z'));
    const engine = new ClosedLoopSimulationEngine({ ...config, realTime: true });
    expect(engine.step()).not.toBeNull(); const snapshot = engine.snapshot();
    vi.advanceTimersByTime(60_000);
    const restored = new ClosedLoopSimulationEngine({ ...config, realTime: true });
    restored.restore(snapshot); expect(restored.step()).toBeNull();
    vi.advanceTimersByTime(1000); expect(restored.step()).not.toBeNull();
  });

  it('rejects restoring a snapshot into a different timing mode', () => {
    vi.setSystemTime(new Date('2026-08-09T00:00:00.000Z'));
    const realTimeEngine = new ClosedLoopSimulationEngine({ ...config, realTime: true });
    const snapshot = realTimeEngine.snapshot();
    const batchEngine = new ClosedLoopSimulationEngine({ ...config, realTime: false });
    expect(() => batchEngine.restore(snapshot)).toThrow('Snapshot real-time mode does not match simulation configuration');
  });

  it('does not create a false transient when state is read at the same simulation timestamp', () => {
    vi.setSystemTime(new Date('2026-08-09T00:00:00.000Z'));
    const engine = new ClosedLoopSimulationEngine({ ...config, realTime: true });
    expect(engine.step()).not.toBeNull();
    const state = engine.getState();
    expect(state.stage).not.toBe('FAULT');
    expect(state.interlocks.pressureTransient).toBe(false);
    expect(state.interlocks.temperatureTransient).toBe(false);
  });

  it('records independent causal safety evidence for each dynamics transition', () => {
    vi.setSystemTime(new Date('2026-08-09T00:00:00.000Z'));
    const engine = new ClosedLoopSimulationEngine({ ...config, realTime: true, safetyLimits: { maxPressureRateMbarPerSecond: 1 } });
    expect(engine.step()).not.toBeNull(); vi.advanceTimersByTime(1000);
    const frame = engine.step();
    expect(frame).not.toBeNull();
    expect(frame?.safety.pressureRateMbarPerSecond).not.toBe(0);
    expect(frame?.safety.pressureRateMbarPerSecond).toBe((frame!.sensorAfter.pressureMbar - frame!.sensorBefore.pressureMbar) / config.dtSeconds);
    expect(frame?.safety.pressureTransient).toBe(true);
  });

  it('does not execute another dynamics step after a safety fault', () => {
    vi.setSystemTime(new Date('2026-08-09T00:00:00.000Z'));
    const engine = new ClosedLoopSimulationEngine({ ...config, realTime: true, safetyLimits: { maxPressureMbar: 900 } });
    expect(engine.step()).not.toBeNull(); expect(engine.getState().stage).toBe('FAULT');
    vi.advanceTimersByTime(5000); expect(engine.step()).toBeNull(); expect(engine.getFrames()).toHaveLength(1);
  });

  it('records the state observed after the dynamics step in the causal frame', () => {
    vi.setSystemTime(new Date('2026-08-09T00:00:00.000Z'));
    const engine = new ClosedLoopSimulationEngine({ ...config, realTime: true });
    const frame = engine.step(); expect(frame).not.toBeNull();
    expect(frame?.stateAfter).toBeDefined();
    expect(frame?.stateAfter?.elapsedSeconds).toBe(frame?.timestampSeconds);
    expect(frame?.stateAfter?.sensors.pressureMbar).toBe(frame?.sensorAfter.pressureMbar);
    expect(engine.getState().elapsedSeconds).toBe(frame?.timestampSeconds);
  });

  it('does not mutate the process state merely by reading getState()', () => {
    vi.setSystemTime(new Date('2026-08-09T00:00:00.000Z'));
    const engine = new ClosedLoopSimulationEngine({ ...config, realTime: true });
    expect(engine.step()).not.toBeNull();
    expect(engine.getState()).toEqual(engine.getState());
  });
});

describe('closed-loop material coupling', () => {
  it('records material inventory on every causal frame', () => {
    const result = new ClosedLoopSimulationEngine({ ...config, realTime: false }).runToCompletion();
    expect(result.frames.length).toBeGreaterThan(0);
    expect(result.frames.every((frame) => frame.materialInventory.totalTrackedMassKg > 0)).toBe(true);
    expect(result.frames.every((frame) => frame.materialInventory.moistureKg >= 0)).toBe(true);
    expect(result.frames.every((frame) => frame.materialInventory.oilInMatrixKg >= 0)).toBe(true);
  });

  it('keeps tracked material mass conserved', () => {
    const result = new ClosedLoopSimulationEngine({ ...config, realTime: false }).runToCompletion();
    for (const frame of result.frames) expect(frame.materialInventory.totalTrackedMassKg).toBeCloseTo(config.materialWeightKg, 10);
  });

  it('changes the material trajectory when thermal drive is reduced', () => {
    const normal = new ClosedLoopSimulationEngine({ ...config, realTime: false, hardware: { heatingPowerKW: 9 } }).runToCompletion();
    const reduced = new ClosedLoopSimulationEngine({ ...config, realTime: false, hardware: { heatingPowerKW: 2 } }).runToCompletion();
    expect(reduced.finalMaterialInventory.moistureKg).toBeGreaterThanOrEqual(normal.finalMaterialInventory.moistureKg);
  });

  it('preserves material inventory across snapshot and restore', () => {
    const first = new ClosedLoopSimulationEngine({ ...config, realTime: false });
    expect(first.step()).not.toBeNull();
    const snapshot = first.snapshot();
    const restored = new ClosedLoopSimulationEngine({ ...config, realTime: false });
    restored.restore(snapshot);
    expect(restored.getMaterialInventory()).toEqual(first.getMaterialInventory());
    expect(restored.getSensors()).toEqual(first.getSensors());
    expect(restored.getState()).toEqual(first.getState());
  });
});
