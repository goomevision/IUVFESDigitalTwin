import { describe, expect, it } from "vitest";
import { simulatePhysicalTimeline } from "./physicalProcessTimeline";

describe("physical process timeline", () => {
  const limits = {
    maxTemperatureC: 100,
    minPressureKPaAbs: 0,
    maxTemperatureRateCPerS: 2,
    maxPressureRateKPaPerS: 5,
    maxHeaterPowerW: 2000,
  };

  it("records physical time and does not teleport temperature to the setpoint", () => {
    const result = simulatePhysicalTimeline(
      { temperatureC: 0, pressureKPaAbs: 101.3, massKg: 10, energyJ: 0 },
      [{ id: "CMD-1", physicalTimeS: 0, targetTemperatureC: 10, heaterPowerW: 100 }],
      limits,
      (state, command, dt) => ({
        ...state,
        temperatureC: state.temperatureC + Math.min(command?.targetTemperatureC ?? state.temperatureC - state.temperatureC, dt * 0.5),
        energyJ: state.energyJ + (command?.heaterPowerW ?? 0) * dt,
      }),
      10,
      1,
    );

    expect(result.samples[0].physicalTimeS).toBe(1);
    expect(result.samples[0].state.temperatureC).toBeLessThan(10);
    expect(result.samples.length).toBeGreaterThan(1);
  });

  it("records a limit event when a requested ramp exceeds the physical limit", () => {
    const result = simulatePhysicalTimeline(
      { temperatureC: 10, pressureKPaAbs: 100, massKg: 10, energyJ: 0 },
      [{ id: "CMD-2", physicalTimeS: 0, targetTemperatureC: 100, heaterPowerW: 2000 }],
      limits,
      (state, command, dt) => ({
        ...state,
        temperatureC: state.temperatureC + (command?.targetTemperatureC ? 20 * dt : 0),
        pressureKPaAbs: state.pressureKPaAbs - 10 * dt,
      }),
      1,
      1,
    );

    expect(result.samples[0].warnings).toContain("TEMPERATURE_RAMP_LIMIT_EXCEEDED");
    expect(result.samples[0].warnings).toContain("PRESSURE_TRANSIENT_LIMIT_EXCEEDED");
    expect(result.events.some((event) => event.type === "LIMIT")).toBe(true);
  });
});
