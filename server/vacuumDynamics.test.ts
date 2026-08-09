import { describe, expect, it } from "vitest";
import { stepVacuumDynamics } from "./vacuumDynamics";

describe("vacuum dynamics", () => {
  const base = {
    timeStepS: 1,
    absolutePressureKPa: 101.325,
    vesselVolumeM3: 1,
    gasTemperatureK: 293.15,
    pumpSpeedM3PerS: 0.01,
    valveOpening: 1,
    vaporGenerationKgPerS: 0,
    gasMolarMassKgPerMol: 0.029,
  };

  it("does not teleport pressure to vacuum maximum", () => {
    const result = stepVacuumDynamics(base);
    expect(result.absolutePressureKPa).toBeGreaterThan(0);
    expect(result.absolutePressureKPa).toBeLessThan(base.absolutePressureKPa);
  });

  it("raises pressure when vapor generation exceeds pumping", () => {
    const result = stepVacuumDynamics({ ...base, pumpSpeedM3PerS: 0, vaporGenerationKgPerS: 0.001 });
    expect(result.absolutePressureKPa).toBeGreaterThan(base.absolutePressureKPa);
    expect(result.pressureRateKPaPerS).toBeGreaterThan(0);
  });

  it("records a rapid transient warning", () => {
    const result = stepVacuumDynamics({ ...base, timeStepS: 10, pumpSpeedM3PerS: 0.5 });
    expect(result.warnings).toContain("RAPID_DECOMPRESSION_TRANSIENT");
  });
});
