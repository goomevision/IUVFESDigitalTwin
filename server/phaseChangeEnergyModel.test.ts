import { describe, expect, it } from "vitest";
import { calculatePhaseChangeEnergy } from "./phaseChangeEnergyModel";

describe("phase-change energy model", () => {
  it("accounts for evaporation with positive energy", () => {
    const result = calculatePhaseChangeEnergy({
      massKg: 2,
      latentHeatJPerKg: 2_000_000,
      qualityStart: 0,
      qualityEnd: 0.5,
      kind: "EVAPORATION",
    });
    expect(result.status).toBe("READY");
    expect(result.energyJ).toBe(2_000_000);
  });

  it("accounts for condensation with negative energy", () => {
    const result = calculatePhaseChangeEnergy({
      massKg: 2,
      latentHeatJPerKg: 2_000_000,
      qualityStart: 1,
      qualityEnd: 0.5,
      kind: "CONDENSATION",
    });
    expect(result.status).toBe("READY");
    expect(result.energyJ).toBe(-2_000_000);
  });

  it("rejects impossible quality direction", () => {
    const result = calculatePhaseChangeEnergy({
      massKg: 1,
      latentHeatJPerKg: 2_000_000,
      qualityStart: 0.8,
      qualityEnd: 0.4,
      kind: "EVAPORATION",
    });
    expect(result.status).toBe("INVALID");
  });
});
