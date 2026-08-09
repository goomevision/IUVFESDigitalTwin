import { describe, expect, it } from "vitest";
import { analyzeOneAtATimeSensitivity } from "./uncertaintySensitivityEngine";

describe("uncertainty and sensitivity engine", () => {
  it("computes deterministic one-at-a-time sensitivity from supplied physics outputs", () => {
    const result = analyzeOneAtATimeSensitivity(
      [{ id: "heaterPower", nominal: 1000, min: 900, max: 1100 }],
      (id, value) => {
        expect(id).toBe("heaterPower");
        return value * 2;
      },
    );

    expect(result[0].absoluteOutputSpan).toBe(400);
    expect(result[0].normalizedSensitivity).toBe(2);
    expect(result[0].samples).toHaveLength(3);
  });

  it("rejects an invalid parameter range", () => {
    expect(() => analyzeOneAtATimeSensitivity(
      [{ id: "bad", nominal: 10, min: 20, max: 30 }],
      (_id, value) => value,
    )).toThrow();
  });
});
