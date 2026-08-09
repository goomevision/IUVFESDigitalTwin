import { describe, expect, it } from "vitest";
import { getScientificEquation, SCIENTIFIC_EQUATIONS } from "./scientificEquationRegistry";

describe("scientific equation registry", () => {
  it("contains auditable governing equations", () => {
    expect(SCIENTIFIC_EQUATIONS.length).toBeGreaterThanOrEqual(6);
    for (const equation of SCIENTIFIC_EQUATIONS) {
      expect(equation.id).toBeTruthy();
      expect(equation.expression).toBeTruthy();
      expect(equation.source).toBeTruthy();
      expect(equation.assumptions.length).toBeGreaterThan(0);
      expect(equation.validWhen.length).toBeGreaterThan(0);
    }
  });

  it("retrieves a known equation by stable id", () => {
    expect(getScientificEquation("ENERGY-001")?.expression).toBe("Q = m * Cp * (T2 - T1)");
  });

  it("does not silently resolve unknown equations", () => {
    expect(getScientificEquation("UNKNOWN")).toBeUndefined();
  });
});
