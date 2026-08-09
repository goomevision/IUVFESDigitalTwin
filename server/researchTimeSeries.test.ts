import { describe, expect, it } from "vitest";
import { compareTimeSeries } from "./researchTimeSeries";

describe("research time series", () => {
  it("compares only common timestamps and preserves source series", () => {
    const result = compareTimeSeries(
      "pressure",
      "kPa",
      [{ timeS: 0, value: 100 }, { timeS: 1, value: 90 }, { timeS: 2, value: 80 }],
      [{ timeS: 0, value: 98 }, { timeS: 1, value: 95 }, { timeS: 3, value: 70 }],
    );

    expect(result.comparedPoints).toBe(2);
    expect(result.absoluteError.map((p) => p.value)).toEqual([2, 5]);
    expect(result.summary.maxAbsoluteError).toBe(5);
    expect(result.summary.meanAbsoluteError).toBe(3.5);
  });

  it("rejects non-monotonic timestamps", () => {
    expect(() => compareTimeSeries(
      "temperature",
      "K",
      [{ timeS: 1, value: 300 }, { timeS: 0, value: 301 }],
      [{ timeS: 0, value: 300 }],
    )).toThrow();
  });
});
