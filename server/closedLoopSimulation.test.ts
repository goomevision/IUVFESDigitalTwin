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

    expect(engine.step()).not.toBeNull();
    expect(engine.step()).toBeNull();

    vi.advanceTimersByTime(999);
    expect(engine.step()).toBeNull();

    vi.advanceTimersByTime(1);
    expect(engine.step()).not.toBeNull();
  });

  it('preserves the wall-clock gate across snapshot restore', () => {
    vi.setSystemTime(new Date('2026-08-09T00:00:00.000Z'));
    const engine = new ClosedLoopSimulationEngine({ ...config, realTime: true });
    expect(engine.step()).not.toBeNull();
    const snapshot = engine.snapshot();

    const restored = new ClosedLoopSimulationEngine({ ...config, realTime: true });
    restored.restore(snapshot);
    expect(restored.step()).toBeNull();

    vi.advanceTimersByTime(1000);
    expect(restored.step()).not.toBeNull();
  });

  it('does not create a false transient when state is read at the same simulation timestamp', () => {
    vi.setSystemTime(new Date('2026-08-09T00:00:00.000Z'));
    const engine = new ClosedLoopSimulationEngine({ ...config, realTime: true });
    const first = engine.step();
    expect(first).not.toBeNull();

    const state = engine.getState();
    expect(state.stage).not.toBe('FAULT');
    expect(state.interlocks.pressureTransient).toBe(false);
    expect(state.interlocks.temperatureTransient).toBe(false);
  });
});
