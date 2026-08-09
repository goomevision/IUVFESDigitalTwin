import { describe, expect, it } from "vitest";
import { requireConsistentUnit } from "./evidenceUnitConsistency";

describe("evidence unit consistency", () => {
  it("accepts a consistent unit", () => {
    expect(requireConsistentUnit([{ value: 1, unit: "kg" }, { value: 2, unit: "kg" }])).toBe("kg");
  });

  it("blocks mixed units until an explicit conversion is performed", () => {
    expect(() => requireConsistentUnit([{ value: 1, unit: "kg" }, { value: 1000, unit: "g" }])).toThrow();
  });
});
