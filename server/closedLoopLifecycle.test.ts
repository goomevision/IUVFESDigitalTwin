import { describe, expect, it } from "vitest";
import { ClosedLoopSimulationEngine } from "./closedLoopSimulation";

function config() {
  return {
    targetPressureMbar: 100,
    targetTemperatureC: 60,
    materialWeightKg: 10,
    waterContentPercent: 50,
    oilContentPercent: 3,
    dtSeconds: 1,
    maxSteps: 600,
  };
}

describe("ClosedLoopSimulationEngine lifecycle continuity", () => {
  it("pauses without mutating the physical state and resumes from the same step", () => {
    const engine = new ClosedLoopSimulationEngine(config());
    const first = engine.step();
    expect(first).toBeDefined();

    const beforePause = engine.snapshot();
    engine.pause();
    expect(engine.isPaused()).toBe(true);

    const pausedStep = engine.step();
    expect(pausedStep).toBeNull();
    const duringPause = engine.snapshot();
    expect(duringPause.stepNumber).toBe(beforePause.stepNumber);
    expect(duringPause.elapsedSeconds).toBe(beforePause.elapsedSeconds);
    expect(duringPause.sensors).toEqual(beforePause.sensors);
    expect(duringPause.frames).toEqual(beforePause.frames);
    expect(duringPause.pausedSteps).toContain(beforePause.stepNumber);

    engine.resume();
    expect(engine.isPaused()).toBe(false);
    const resumed = engine.step();
    expect(resumed).toBeDefined();
    expect(resumed!.step).toBe(beforePause.stepNumber + 1);
    expect(resumed!.timestampSeconds).toBe(beforePause.elapsedSeconds + config().dtSeconds);
  });

  it("restores PID, process-state, dynamics and frame history as one deterministic state", () => {
    const original = new ClosedLoopSimulationEngine(config());
    for (let i = 0; i < 12; i += 1) expect(original.step()).toBeDefined();
    const snapshot = original.snapshot();

    const restored = new ClosedLoopSimulationEngine(config());
    restored.restore(snapshot);

    expect(restored.snapshot()).toEqual(snapshot);
    expect(restored.step()).toEqual(original.step());
  });

  it("reset returns the simulator to its initial physical and lifecycle state", () => {
    const engine = new ClosedLoopSimulationEngine(config());
    for (let i = 0; i < 8; i += 1) expect(engine.step()).toBeDefined();
    engine.pause();
    expect(engine.isPaused()).toBe(true);

    engine.reset();
    const snapshot = engine.snapshot();
    expect(engine.isPaused()).toBe(false);
    expect(snapshot.stepNumber).toBe(0);
    expect(snapshot.elapsedSeconds).toBe(0);
    expect(snapshot.frames).toHaveLength(0);
    expect(snapshot.pausedSteps).toHaveLength(0);
    expect(snapshot.sensors).toEqual({
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
