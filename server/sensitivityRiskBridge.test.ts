import { describe, expect, it } from "vitest";
import { buildSensitivityRiskPriorities } from "./sensitivityRiskBridge";

describe("sensitivity risk bridge", () => {
  it("prioritizes sensitive parameters with declared uncertainty", () => {
    const result = buildSensitivityRiskPriorities(
      [
        {
          parameterId: "heaterPower",
          nominal: 1000,
          range: { min: 900, max: 1100 },
          absoluteOutputSpan: 200,
          normalizedSensitivity: 1.2,
          samples: [],
        },
        {
          parameterId: "feedMass",
          nominal: 10,
          range: { min: 9, max: 11 },
          absoluteOutputSpan: 2,
          normalizedSensitivity: 0.2,
          samples: [],
        },
      ],
      [{
        id: "U-HEATER",
        name: "heaterPower",
        value: 20,
        unit: "W",
        method: "calibration",
        scope: "heater",
        provenanceId: "P-1",
        independent: true,
      }],
    );

    expect(result[0].priority).toBe("HIGH");
    expect(result[0].uncertaintySourceIds).toEqual(["U-HEATER"]);
    expect(result[1].priority).toBe("LOW");
  });
});
