import { describe, expect, it } from "vitest";
import { advanceVacuumState } from "./vacuumSystemDynamics";

describe("vacuum system dynamics", () => {
  const parameters = {
    vesselVolumeM3: 1,
    effectivePumpSpeedM3PerS: 0.1,
    leakRateKgPerS: 0,
    gasConstantJPerKgK: 287,
    temperatureK: 293.15,
    minAbsolutePressureKPa: 0.001,
  };

  it("reduces pressure when effective pumping exceeds leakage", () => {
    const result = advanceVacuumState({ pressureKPaAbs: 100, gasMassKg: 1.185, vaporMassKg: 0 }, parameters, 1);
    expect(result.state.pressureKPaAbs).toBeLessThan(100);
    expect(result.pumpedMassKg).toBeGreaterThan(0);
  });

  it("records when leakage exceeds pumping", () => {
    const result = advanceVacuumState({ pressureKPaAbs: 10, gasMassKg: 0.1185, vaporMassKg: 0 }, { ...parameters, leakRateKgPerS: 0.2 }, 1);
    expect(result.warnings).toContain("LEAKAGE_EXCEEDS_PUMPED_MASS");
  });
});
