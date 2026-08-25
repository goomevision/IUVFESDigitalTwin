import { describe, expect, it } from "vitest";
import { getProcessMachineActuatorVisualLevels, getProcessMachineVisualState } from "../client/src/components/ProcessMachine3D";
import { ClosedLoopSimulationEngine } from "./closedLoopSimulation";

describe("P15 ProcessMachine3D visual authority", () => {
  it("uses the active CausalFrame as the only source for visual time and process state", () => {
    const engine = new ClosedLoopSimulationEngine({
      targetPressureMbar: 120,
      targetTemperatureC: 80,
      materialWeightKg: 10,
      waterContentPercent: 45,
      oilContentPercent: 3.5,
      dtSeconds: 2,
      maxSteps: 4,
    });
    const frame = engine.step();

    expect(frame).not.toBeNull();
    if (!frame) return;

    const visual = getProcessMachineVisualState(frame);
    expect(visual.timestampSeconds).toBe(frame.timestampSeconds);
    expect(visual.temperatureC).toBe(frame.sensorAfter.temperatureC);
    expect(visual.pressureMbar).toBe(frame.sensorAfter.pressureMbar);
    expect(visual.commands).toBe(frame.effectiveCommands);
    expect(visual.actuatorLevels).toBe(frame.actuatorLevels);
  });

  it("maps only authoritative actuatorLevels into clamped visual intensities", () => {
    const engine = new ClosedLoopSimulationEngine({
      targetPressureMbar: 120,
      targetTemperatureC: 80,
      materialWeightKg: 10,
      waterContentPercent: 45,
      oilContentPercent: 3.5,
      dtSeconds: 1,
      maxSteps: 4,
    });
    const frame = engine.step();

    expect(frame).not.toBeNull();
    if (!frame) return;

    const levels = getProcessMachineActuatorVisualLevels(frame);
    expect(levels.heater).toBeGreaterThanOrEqual(0);
    expect(levels.heater).toBeLessThanOrEqual(1);
    expect(levels.vacuumPump).toBeGreaterThanOrEqual(0);
    expect(levels.vacuumPump).toBeLessThanOrEqual(1);
    expect(levels.extractor).toBeGreaterThanOrEqual(0);
    expect(levels.condenser).toBeGreaterThanOrEqual(0);
    expect(levels.cooling).toBeGreaterThanOrEqual(0);
  });

  it("keeps absent measurements and frames explicitly unavailable", () => {
    const visual = getProcessMachineVisualState();

    expect(visual.hasFrame).toBe(false);
    expect(visual.timestampSeconds).toBeUndefined();
    expect(visual.temperatureC).toBeUndefined();
    expect(visual.actuatorLevels).toBeUndefined();
  });
});
