import { describe, expect, it } from "vitest";
import { stepProcessPhysics } from "./processPhysicsEngine";

describe("process physics kernel", () => {
  it("advances temperature using the transient energy balance", () => {
    const result = stepProcessPhysics({
      initial: { timeSeconds: 0, temperatureK: 300, pressurePa: 101325, massKg: 2, internalEnergyJ: 0 },
      dtSeconds: 10,
      massKg: 2,
      cpJPerKgK: 1000,
      heatInputW: 100,
    });

    expect(result.state.timeSeconds).toBe(10);
    expect(result.state.temperatureK).toBeCloseTo(300.5, 10);
    expect(result.diagnostics.equationIds).toContain("THERMAL-001");
    expect(Math.abs(result.diagnostics.energyResidualJ)).toBeLessThan(1e-9);
  });

  it("preserves the mass balance for inlet and outlet flow", () => {
    const result = stepProcessPhysics({
      initial: { timeSeconds: 0, temperatureK: 300, pressurePa: 101325, massKg: 10, internalEnergyJ: 0 },
      dtSeconds: 5,
      massKg: 10,
      cpJPerKgK: 1000,
      heatInputW: 0,
      massInKgPerS: 0.4,
      massOutKgPerS: 0.1,
    });

    expect(result.state.massKg).toBeCloseTo(11.5, 10);
    expect(Math.abs(result.diagnostics.massResidualKg)).toBeLessThan(1e-10);
  });

  it("reports when an ideal-gas pressure approximation is active", () => {
    const result = stepProcessPhysics({
      initial: { timeSeconds: 0, temperatureK: 300, pressurePa: 101325, massKg: 1, internalEnergyJ: 0 },
      dtSeconds: 1,
      massKg: 1,
      cpJPerKgK: 1000,
      heatInputW: 0,
      chamberVolumeM3: 1,
      gasMoles: 1,
    });

    expect(result.diagnostics.equationIds).toContain("PRESSURE-001");
    expect(result.diagnostics.warnings).toContain("IDEAL_GAS_APPROXIMATION_ACTIVE");
  });
});
