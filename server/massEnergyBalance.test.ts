import { describe, expect, it } from "vitest";
import { validateEnergyBalance, validateMassBalance } from "./massEnergyBalance";

describe("mass and energy balance", () => {
  it("passes a closed mass balance within tolerance", () => {
    const result = validateMassBalance({ materialInKg: 10, waterRemovedKg: 3, oilRecoveredKg: 4, solidRecoveredKg: 2, wasteKg: 1 }, { absoluteKg: 0.01 });
    expect(result.verdict).toBe("PASS");
    expect(result.closureError).toBe(0);
  });

  it("fails when mass is not accounted for", () => {
    const result = validateMassBalance({ materialInKg: 10, waterRemovedKg: 3, oilRecoveredKg: 4 }, { relativePercent: 1 });
    expect(result.verdict).toBe("FAIL");
    expect(result.closureError).toBe(3);
  });

  it("does not invent a verdict without a tolerance", () => {
    const result = validateEnergyBalance({ energyInputKwh: 10, heatingKwh: 4, vacuumKwh: 2, extractionKwh: 3, coolingKwh: 1 });
    expect(result.verdict).toBe("INCONCLUSIVE");
  });

  it("uses energy units for energy tolerance", () => {
    const result = validateEnergyBalance(
      { energyInputKwh: 10, heatingKwh: 4, vacuumKwh: 2, extractionKwh: 3, coolingKwh: 1 },
      { absoluteKwh: 0.01 },
    );
    expect(result.verdict).toBe("PASS");
  });

  it("rejects non-finite values as inconclusive", () => {
    const result = validateEnergyBalance({ energyInputKwh: Number.NaN, heatingKwh: 1 }, { absoluteKwh: 0.1 });
    expect(result.verdict).toBe("INCONCLUSIVE");
  });
});
