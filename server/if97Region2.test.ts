import { describe, expect, it } from "vitest";
import { region2Properties } from "./if97Region2";

const cases = [
  { p: 0.0035, t: 300, v: 39.4913866, h: 2549.91145, u: 2411.69160, s: 8.52238967, cp: 1.91300162 },
  { p: 0.0035, t: 700, v: 92.3015898, h: 3335.68375, u: 3012.62819, s: 10.1749996, cp: 2.08141274 },
  { p: 30, t: 700, v: 0.00542946619, h: 2631.49474, u: 2468.61076, s: 5.17540298, cp: 10.3505092 },
] as const;

describe("IAPWS-IF97 Region 2", () => {
  it.each(cases)("matches the official verification state $p MPa / $t K", (c) => {
    const state = region2Properties(c.p, c.t);
    expect(state.specificVolumeM3PerKg).toBeCloseTo(c.v, 7);
    expect(state.enthalpyKJPerKg).toBeCloseTo(c.h, 5);
    expect(state.internalEnergyKJPerKg).toBeCloseTo(c.u, 5);
    expect(state.entropyKJPerKgK).toBeCloseTo(c.s, 6);
    expect(state.cpKJPerKgK).toBeCloseTo(c.cp, 7);
  });

  it("rejects states outside the temperature domain", () => {
    expect(() => region2Properties(1, 1200)).toThrow();
  });
});
