import { describe, expect, it } from "vitest";
import { ClosedLoopSimulationEngine } from "./closedLoopSimulation";

describe("ClosedLoopSimulationEngine persistence", () => {
  const config = {
    targetPressureMbar: 100,
    targetTemperatureC: 70,
    materialWeightKg: 10,
    waterContentPercent: 20,
    oilContentPercent: 5,
    dtSeconds: 1,
    maxSteps: 100,
  };

  it("restores the exact next-step state", () => {
    const first = new ClosedLoopSimulationEngine(config);
    first.step();
    first.step();
    const snapshot = first.snapshot();

    const restored = new ClosedLoopSimulationEngine(config);
    restored.restore(snapshot);

    const originalNext = first.step();
    const restoredNext = restored.step();

    expect(restoredNext).toEqual(originalNext);
    expect(restored.snapshot().stepNumber).toBe(3);
  });

  it("pause survives serialization and prevents advancement", () => {
    const engine = new ClosedLoopSimulationEngine(config);
    engine.step();
    engine.pause();
    const snapshot = engine.snapshot();

    const restored = new ClosedLoopSimulationEngine(config);
    restored.restore(snapshot);
    expect(restored.isPaused()).toBe(true);
    expect(restored.step()).toBeNull();
    expect(restored.getSensors()).toEqual(snapshot.sensors);
  });
});
