import { describe, expect, it } from "vitest";
import { ClosedLoopSimulationEngine, type CausalFrame } from "../../../server/closedLoopSimulation";
import { getProcessMachineVisualState } from "./ProcessMachine3D";

describe("getProcessMachineVisualState", () => {
  it("keeps missing frame data UNKNOWN instead of inventing values", () => {
    const visual = getProcessMachineVisualState();

    expect(visual.hasFrame).toBe(false);
    expect(visual.temperatureC).toBeUndefined();
    expect(visual.pressureMbar).toBeUndefined();
    expect(visual.commands).toBeUndefined();
    expect(visual.controlOutput).toBeUndefined();
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
    expect(visual.controlOutput).toEqual(frame!.controlOutput);
    expect(visual.temperatureC).toBe(frame!.sensorAfter.temperatureC);
    expect(visual.pressureMbar).toBe(frame!.sensorAfter.pressureMbar);
    expect(visual.coldTrapTemperaturesC).toEqual(frame!.hardwareDiagnostics.coldTrapTemperaturesC);
    expect(visual.condensedWaterKg).toEqual(frame!.hardwareDiagnostics.coldTrapStageCondensedWaterKg);
  });
});
