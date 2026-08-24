import { describe, expect, it } from "vitest";
import { ClosedLoopSimulationEngine, type CausalFrame } from "../../../server/closedLoopSimulation";
import { getProcessMachineActuatorVisualLevels, getProcessMachineVisualState } from "./ProcessMachine3D";

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

  it("preserves each continuous actuator level from the authoritative frame", () => {
    const frame = {
      timestampSeconds: 5,
      safety: { stage: "EXTRACTION" },
      effectiveCommands: { vacuumPump: true, heater: true, extractor: true, condenser: true, cooling: true },
      actuatorLevels: { heater: 0.2, vacuumPump: 0.5, extractor: 0.8, condenser: 1, cooling: 0.35 },
      controlOutput: { heaterPower: 0.2, vacuumPumpPower: 0.5, valve: { vacuumIsolation: 1, vaporToCondenser: 1, coolingWater: 0.35 } },
      sensorAfter: { temperatureC: 60, pressureMbar: 90 },
      materialInventory: { initialMassKg: 10, remainingMassKg: 8 },
      ultrasonic: { activityIndex: 0.5, effectivePowerW: 300 },
      hardwareDiagnostics: { coldTrapTemperaturesC: [0, -20, -40, -80], coldTrapStageCondensedWaterKg: [0, 0, 0, 0] },
    } as unknown as CausalFrame;

    const visual = getProcessMachineVisualState(frame);
    expect(visual.actuatorLevels).toEqual(frame.actuatorLevels);
    expect(visual.controlOutput).toEqual(frame.controlOutput);
    expect(visual.commands).toEqual(frame.effectiveCommands);
    expect(visual.timestampSeconds).toBe(5);
  });

  it("maps every continuous actuator level monotonically without synthesizing telemetry", () => {
    const levels = [0, 0.2, 0.5, 0.8, 1];
    const mapped = levels.map(level => getProcessMachineActuatorVisualLevels({ actuatorLevels: { heater: level, vacuumPump: level, extractor: level, condenser: level, cooling: level } } as CausalFrame));

    (["heater", "vacuumPump", "extractor", "condenser", "cooling"] as const).forEach(actuator => {
      expect(mapped.map(value => value[actuator])).toEqual(levels);
    });
  });
});
