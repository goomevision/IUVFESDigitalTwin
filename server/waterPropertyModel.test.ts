import { describe, expect, it } from "vitest";
import { waterVaporPressureBarAbs } from "./waterPropertyModel";

describe("water property model", () => {
  it("returns a source-backed vapor pressure inside its declared range", () => {
    const result = waterVaporPressureBarAbs(283.15);
    expect(result.unit).toBe("bar_abs");
    expect(result.value).toBeGreaterThan(0);
    expect(result.sourceId).toContain("NIST-WATER-ANTOINE");
  });

  it("rejects temperatures outside the correlation range", () => {
    expect(() => waterVaporPressureBarAbs(250)).toThrow();
    expect(() => waterVaporPressureBarAbs(310)).toThrow();
  });
});
