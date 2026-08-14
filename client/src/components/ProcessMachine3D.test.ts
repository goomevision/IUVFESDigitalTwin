import { describe, expect, it } from "vitest";
import { ClosedLoopSimulationEngine, type CausalFrame } from "../../../server/closedLoopSimulation";
import { getActuatorVisualIntensity, getProcessMachineVisualState } from "./ProcessMachine3D";

describe("getProcessMachineVisualState", () => {
  it("keeps missing frame data UNKNOWN instead of inventing values", () => {
    const visual = getProcessMachineVisualState();

    expect(visual.hasFrame).toBe(false);
    expect(visual.temperatureC).toBeUndefined();
    expect(visual.pressureMbar).toBeUndefined();
    expect(visual.commands).toBeUndefined();
    expect(visual.actuatorLevels).toBeUndefined();
    expect(visual.coldTrapTemperaturesC).toBeUndefined();
    expect(visual.condensedWaterKg).toBeUndefined();
  });

  it("binds process-machine state to the actual CausalFrame", () => {
    const engine = new ClosedLoopSimulationEngine({
      targetPressureMbar: 100,
      targetTemperatureC: 70,
      materialWeightKg: 10,
      waterContentPercent: 20,
      oilContentPercent: 5,
      dtSeconds: 1,
      maxSteps: 10,
    });
    const frame = engine.step();
    expect(frame).not.toBeNull();

    const visual = getProcessMachineVisualState(frame as CausalFrame);

    expect(visual.hasFrame).toBe(true);
    expect(visual.stage).toBe(frame!.safety.stage);
    expect(visual.timestampSeconds).toBe(frame!.timestampSeconds);
    expect(visual.commands).toEqual(frame!.effectiveCommands);
    expect(visual.actuatorLevels).toEqual(frame!.actuatorLevels);
    expect(visual.temperatureC).toBe(frame!.sensorAfter.temperatureC);
    expect(visual.pressureMbar).toBe(frame!.sensorAfter.pressureMbar);
    expect(visual.coldTrapTemperaturesC).toEqual(frame!.hardwareDiagnostics.coldTrapTemperaturesC);
    expect(visual.condensedWaterKg).toEqual(frame!.hardwareDiagnostics.coldTrapStageCondensedWaterKg);
  });

  it("maps continuous actuator levels monotonically into visual intensity", () => {
    expect(getActuatorVisualIntensity(0)).toBe(0);
    expect(getActuatorVisualIntensity(0.2)).toBe(0.2);
    expect(getActuatorVisualIntensity(0.5)).toBe(0.5);
    expect(getActuatorVisualIntensity(0.8)).toBe(0.8);
    expect(getActuatorVisualIntensity(1)).toBe(1);
    expect(getActuatorVisualIntensity(-1)).toBe(0);
    expect(getActuatorVisualIntensity(2)).toBe(1);
    expect(getActuatorVisualIntensity(undefined)).toBe(0);
  });
});
