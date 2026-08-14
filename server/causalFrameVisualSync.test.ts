import { describe, expect, it } from "vitest";
import { ClosedLoopSimulationEngine } from "./closedLoopSimulation";

describe("causal frame visual synchronization contract", () => {
  it("keeps visualizable process values in the same causal frame", () => {
    const engine = new ClosedLoopSimulationEngine({
      targetPressureMbar: 120,
      targetTemperatureC: 80,
      materialWeightKg: 10,
      waterContentPercent: 45,
      oilContentPercent: 3.5,
      dtSeconds: 1,
      maxSteps: 8,
    });

    const frame = engine.step();
    expect(frame).not.toBeNull();

    if (!frame) return;

    expect(frame.timestampSeconds).toBeGreaterThan(0);
    expect(frame.sensorAfter).toEqual(frame.physicalSensorAfter);
    expect(frame.actuatorLevels).toBeDefined();
    expect(frame.effectiveCommands).toBeDefined();
    expect(frame.hardwareDiagnostics).toBeDefined();
    expect(frame.materialInventory).toBeDefined();
    expect(frame.ultrasonic).toBeDefined();
    expect(frame.controllerAfterActuation.sensors).toEqual(frame.sensorAfter);
    expect(frame.safety.stage).toBe(frame.controllerAfterActuation.stage);
  });

  it("does not allow a visual consumer to substitute wall-clock time for the frame timestamp", () => {
    const engine = new ClosedLoopSimulationEngine({
      targetPressureMbar: 120,
      targetTemperatureC: 80,
      materialWeightKg: 10,
      waterContentPercent: 45,
      oilContentPercent: 3.5,
      dtSeconds: 2,
      maxSteps: 4,
    });

    const first = engine.step();
    const second = engine.step();

    expect(first?.timestampSeconds).toBe(2);
    expect(second?.timestampSeconds).toBe(4);
    expect(second?.timestampSeconds).not.toBe(first?.timestampSeconds);
  });
});
