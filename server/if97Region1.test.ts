import { describe, expect, it } from "vitest";
import { region1Properties } from "./if97Region1";

describe("IAPWS-IF97 Region 1", () => {
  const cases = [
    {
      T: 300,
      p: 3,
      v: 0.00100215168,
      h: 115.331273,
      u: 112.324818,
      s: 0.392294792,
      cp: 4.17301218,
    },
    {
      T: 300,
      p: 80,
      v: 0.000971180894,
      h: 184.142828,
      u: 106.448356,
      s: 0.368563852,
      cp: 4.01008987,
    },
    {
      T: 500,
      p: 3,
      v: 0.00120241800,
      h: 975.542239,
      u: 971.934985,
      s: 2.58041912,
      cp: 4.65580682,
    },
  ];

  for (const c of cases) {
    it(`matches IF97 verification point T=${c.T} K, p=${c.p} MPa`, () => {
      const state = region1Properties(c.T, c.p);
      expect(state.specificVolumeM3PerKg).toBeCloseTo(c.v, 9);
      expect(state.enthalpyJPerKg / 1000).toBeCloseTo(c.h, 5);
      expect(state.internalEnergyJPerKg / 1000).toBeCloseTo(c.u, 5);
      expect(state.entropyJPerKgK / 1000).toBeCloseTo(c.s, 7);
      expect(state.cpJPerKgK / 1000).toBeCloseTo(c.cp, 6);
    });
  }

  it("rejects states outside the Region 1 T-p envelope", () => {
    expect(() => region1Properties(250, 3)).toThrow();
    expect(() => region1Properties(700, 3)).toThrow();
    expect(() => region1Properties(300, 0)).toThrow();
    expect(() => region1Properties(300, 101)).toThrow();
  });
});
