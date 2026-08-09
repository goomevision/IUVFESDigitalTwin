import { describe, expect, it } from "vitest";
import { WATER_REFERENCE_STATES } from "./thermodynamicReferenceStates";

describe("water thermodynamic reference-state contract", () => {
  it("contains distinct saturation, liquid and vapor cases", () => {
    expect(WATER_REFERENCE_STATES.map((state) => state.expectedRegion)).toEqual([
      "SATURATION",
      "LIQUID",
      "VAPOR",
    ]);
  });

  it("uses absolute pressure and authoritative IAPWS references", () => {
    for (const state of WATER_REFERENCE_STATES) {
      expect(state.absolutePressureMPa).toBeGreaterThan(0);
      expect(state.source).toContain("IAPWS-IF97");
    }
  });
});
