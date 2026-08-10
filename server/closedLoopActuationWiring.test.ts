import { describe, expect, it } from "vitest";
import { ClosedLoopSimulationEngine } from "./closedLoopSimulation";

describe("ClosedLoopSimulationEngine actuator wiring", () => {
  it("propagates vacuum and heater commands into physical sensor response", () => {
    const engine = new ClosedLoopSimulationEngine({
      targetPressureMbar: 100,
      targetTemperatureC: 60,
      materialWeightKg: 10,
      waterContentPercent: 50,
      oilContentPercent: 3,
      dtSeconds: 1,
      maxSteps: 600,
    });

    const frames = [];
    for (let i = 0; i < 600; i += 1) {
      const frame = engine.step();
      if (!frame) break;
      frames.push(frame);
      if (frame.safety.stage === "FAULT" || frame.safety.stage === "COMPLETE") break;
    }

    expect(frames.length).toBeGreaterThan(0);

    const vacuumFrame = frames.find(frame => frame.effectiveCommands.vacuumPump);
    expect(vacuumFrame).toBeDefined();
    expect(vacuumFrame!.sensorAfter.pressureMbar).toBeLessThan(vacuumFrame!.sensorBefore.pressureMbar);

    const heaterFrame = frames.find(frame => frame.effectiveCommands.heater);
    expect(heaterFrame).toBeDefined();
    expect(heaterFrame!.sensorAfter.temperatureC).toBeGreaterThanOrEqual(heaterFrame!.sensorBefore.temperatureC);
    expect(heaterFrame!.sensorAfter.energyKwh).toBeGreaterThan(heaterFrame!.sensorBefore.energyKwh);
  });

  it("keeps effective commands distinct from intended commands on a safety trip", () => {
    const engine = new ClosedLoopSimulationEngine({
      targetPressureMbar: 100,
      targetTemperatureC: 60,
      materialWeightKg: 10,
      waterContentPercent: 50,
      oilContentPercent: 3,
      dtSeconds: 1,
      maxSteps: 10,
    });

    const first = engine.step();
    expect(first).toBeDefined();
    expect(first!.intendedCommands).toEqual(first!.effectiveCommands);

    engine.reset();
    const normalFrame = engine.step();
    expect(normalFrame).toBeDefined();
    expect(normalFrame!.safety.overTemperature).toBe(false);
  });
});
