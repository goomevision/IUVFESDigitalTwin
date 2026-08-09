import { describe, expect, it } from "vitest";
import { advanceProcessLoop } from "./transientProcessLoop";

describe("transient process loop", () => {
  it("subdivides oversized simulation intervals", () => {
    const calls: number[] = [];
    const result = advanceProcessLoop({
      dtS: 2,
      maxDtS: 0.5,
      state: { timeS: 0, pressureKPa: 100, temperatureK: 300, massKg: 1, quality: null },
      step: (state, dtS) => {
        calls.push(dtS);
        return { ...state, pressureKPa: state.pressureKPa - dtS };
      },
    });

    expect(calls).toEqual([0.5, 0.5, 0.5, 0.5]);
    expect(result.timeS).toBeCloseTo(2);
    expect(result.pressureKPa).toBeCloseTo(98);
  });

  it("rejects non-positive time steps", () => {
    expect(() => advanceProcessLoop({
      dtS: 0,
      state: { timeS: 0, pressureKPa: 100, temperatureK: 300, massKg: 1, quality: null },
      step: (state) => state,
    })).toThrow();
  });
});
