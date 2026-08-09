import { describe, expect, it } from "vitest";
import { calculateIdealTpFlash } from "./multicomponentVleEngine";

describe("multicomponent VLE engine", () => {
  it("identifies a single-liquid state when all K values are below one", () => {
    const result = calculateIdealTpFlash(283.15, 20, [
      { id: "A", name: "A", molecularWeightKgPerKmol: 18, liquidMoleFraction: 1, vaporPressureKPaAbs: 1, enabled: true },
    ]);
    expect(result.status).toBe("SINGLE_LIQUID");
    expect(result.vaporFraction).toBe(0);
  });

  it("identifies a single-vapor state when all K values exceed one", () => {
    const result = calculateIdealTpFlash(373.15, 1, [
      { id: "A", name: "A", molecularWeightKgPerKmol: 18, liquidMoleFraction: 1, vaporPressureKPaAbs: 101, enabled: true },
    ]);
    expect(result.status).toBe("SINGLE_VAPOR");
    expect(result.vaporFraction).toBe(1);
  });

  it("solves a two-phase split when K values straddle one", () => {
    const result = calculateIdealTpFlash(300, 10, [
      { id: "A", name: "A", molecularWeightKgPerKmol: 18, liquidMoleFraction: 0.5, vaporPressureKPaAbs: 20, enabled: true },
      { id: "B", name: "B", molecularWeightKgPerKmol: 40, liquidMoleFraction: 0.5, vaporPressureKPaAbs: 2, enabled: true },
    ]);
    expect(result.status).toBe("EQUILIBRIUM");
    expect(result.vaporFraction).toBeGreaterThan(0);
    expect(result.vaporFraction).toBeLessThan(1);
    expect(result.components.reduce((s, c) => s + c.vaporMoleFraction, 0)).toBeCloseTo(1);
  });
});
