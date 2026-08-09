import { describe, expect, it } from "vitest";
import { advanceMassTransfer } from "./massTransferDynamics";

describe("mass transfer dynamics", () => {
  it("moves mass toward equilibrium when driving force is positive", () => {
    const result = advanceMassTransfer(
      { liquidMassKg: 1, vaporMassKg: 0 },
      {
        transferCoefficientKgPerSPa: 1e-7,
        equilibriumVaporPressureKPa: 5,
        actualVaporPartialPressureKPa: 1,
      },
      1,
    );
    expect(result.rateKgPerS).toBeGreaterThan(0);
    expect(result.state.liquidMassKg).toBeLessThan(1);
    expect(result.state.vaporMassKg).toBeGreaterThan(0);
  });

  it("does not evaporate when actual partial pressure reaches equilibrium", () => {
    const result = advanceMassTransfer(
      { liquidMassKg: 1, vaporMassKg: 0 },
      {
        transferCoefficientKgPerSPa: 1e-7,
        equilibriumVaporPressureKPa: 5,
        actualVaporPartialPressureKPa: 5,
      },
      1,
    );
    expect(result.rateKgPerS).toBe(0);
    expect(result.state.liquidMassKg).toBe(1);
  });
});
