import { describe, expect, it } from "vitest";
import { ClosedLoopSimulationEngine } from "./closedLoopSimulation";

describe("ClosedLoopSimulationEngine recovery", () => {
  it("restores state and produces the same next causal frame", () => {
    const configuration = {
      targetPressureMbar: 100,
      targetTemperatureC: 60,
      coolingTemperatureC: 35,
      materialWeightKg: 10,
      waterContentPercent: 45,
      oilContentPercent: 3.5,
      dtSeconds: 1,
      maxSteps: 20,
    };

    const engine = new ClosedLoopSimulationEngine(configuration);
    engine.resume();

    const firstFrame = engine.step();
    expect(firstFrame).not.toBeNull();

    const snapshot = engine.getSnapshot();
    const restored = new ClosedLoopSimulationEngine(configuration);
    restored.restore(snapshot);

    const restoredSnapshot = restored.getSnapshot();
    expect(restoredSnapshot.stepNumber).toBe(snapshot.stepNumber);
    expect(restoredSnapshot.elapsedSeconds).toBe(snapshot.elapsedSeconds);
    expect(restoredSnapshot.sensors).toEqual(snapshot.sensors);
    expect(restoredSnapshot.state).toEqual(snapshot.state);
    expect(restoredSnapshot.frames).toHaveLength(snapshot.frames.length);
    expect(restoredSnapshot.frames.at(-1)?.step).toBe(snapshot.frames.at(-1)?.step);
    expect(restoredSnapshot.frames.at(-1)?.sensorAfter).toEqual(snapshot.frames.at(-1)?.sensorAfter);

    const nextOriginal = engine.step();
    const nextRestored = restored.step();
    expect(nextRestored).toEqual(nextOriginal);
  });
});
