import { describe, expect, it } from "vitest";
import { evaluateDimensionlessGibbs, gibbsProperties } from "./if97GibbsDerivativeKernel";

describe("IF97 Gibbs derivative kernel", () => {
  it("evaluates a simple coefficient set and its derivatives", () => {
    const result = evaluateDimensionlessGibbs(2, 3, [
      { n: 1, I: 0, J: 0 },
      { n: 2, I: 1, J: 0 },
      { n: 3, I: 0, J: 1 },
      { n: 4, I: 2, J: 0 },
      { n: 5, I: 0, J: 2 },
      { n: 6, I: 1, J: 1 },
    ]);

    expect(result.gamma).toBe(1 + 4 + 9 + 16 + 45 + 36);
    expect(result.gammaPi).toBe(2 + 16 + 18);
    expect(result.gammaTau).toBe(3 + 30 + 12);
    expect(result.gammaPiPi).toBe(8);
    expect(result.gammaTauTau).toBe(30);
    expect(result.gammaPiTau).toBe(6);
  });

  it("converts derivatives into thermodynamic properties with explicit scales", () => {
    const evaluation = evaluateDimensionlessGibbs(1, 1, [
      { n: 1, I: 0, J: 0 },
      { n: 1, I: 1, J: 0 },
      { n: 1, I: 0, J: 1 },
      { n: -1, I: 0, J: 2 },
    ]);
    const state = gibbsProperties(evaluation, 300, 1, 461.526, 1, 300);

    expect(Number.isFinite(state.specificVolumeM3PerKg)).toBe(true);
    expect(Number.isFinite(state.enthalpyJPerKg)).toBe(true);
    expect(Number.isFinite(state.entropyJPerKgK)).toBe(true);
    expect(Number.isFinite(state.internalEnergyJPerKg)).toBe(true);
    expect(Number.isFinite(state.cpJPerKgK)).toBe(true);
  });

  it("rejects invalid normalized state", () => {
    expect(() => evaluateDimensionlessGibbs(0, 1, [])).toThrow();
    expect(() => evaluateDimensionlessGibbs(1, 0, [])).toThrow();
  });
});
