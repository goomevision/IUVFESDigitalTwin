import { describe, expect, it } from "vitest";
import { getProcessMachineVisualState } from "./ProcessMachine3D";
import type { CausalFrame } from "../../../server/closedLoopSimulation";

describe("ProcessMachine3D frame binding", () => {
  it("keeps the visual model unknown when no CausalFrame exists", () => {
    const visual = getProcessMachineVisualState();
    expect(visual.hasFrame).toBe(false);
    expect(visual.stage).toBeUndefined();
    expect(visual.temperatureC).toBeUndefined();
    expect(visual.pressureMbar).toBeUndefined();
    expect(visual.commands).toBeUndefined();
  });

  it("maps state, sensors, commands, and diagnostics directly from the frame", () => {
    const frame = {
      timestampSeconds: 42,
      safety: { stage: "CONDENSATION", overTemperature: false, vacuumAchieved: true },
      effectiveCommands: { vacuumPump: true, heater: false, extractor: false, condenser: true, cooling: true },
      sensorAfter: { temperatureC: 18.5, pressureMbar: 12.4 },
      hardwareDiagnostics: {
        coldTrapTemperaturesC: [2, -20, -41, -79],
        coldTrapStageCondensedWaterKg: [0.1, 0.2, 0.3, 0.4],
      },
    } as unknown as CausalFrame;

    const visual = getProcessMachineVisualState(frame);
    expect(visual.hasFrame).toBe(true);
    expect(visual.stage).toBe("CONDENSATION");
    expect(visual.timestampSeconds).toBe(42);
    expect(visual.temperatureC).toBe(18.5);
    expect(visual.pressureMbar).toBe(12.4);
    expect(visual.commands).toEqual(frame.effectiveCommands);
    expect(visual.coldTrapTemperaturesC).toEqual(frame.hardwareDiagnostics.coldTrapTemperaturesC);
    expect(visual.condensedWaterKg).toEqual(frame.hardwareDiagnostics.coldTrapStageCondensedWaterKg);
  });
});
