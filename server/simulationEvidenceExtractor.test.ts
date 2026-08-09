import { describe, expect, it } from "vitest";
import { extractSimulationEvidence } from "./simulationEvidenceExtractor";

describe("simulation evidence extractor", () => {
  it("extracts traceable extrema, rates, balances and warnings", () => {
    const result = extractSimulationEvidence({
      simulationRunId: "SIM-001",
      modelVersion: "MODEL-1",
      parameterSetId: "PARAM-1",
      datasetIds: ["DATA-1"],
      pressureKPa: [{ timeS: 0, value: 100 }, { timeS: 2, value: 80 }],
      temperatureK: [{ timeS: 0, value: 300 }, { timeS: 2, value: 340 }],
      massKg: [{ timeS: 0, value: 10 }, { timeS: 2, value: 9.5 }],
      quality: [{ timeS: 0, value: 0 }, { timeS: 2, value: 1 }],
      yield: 5,
      energyInputJ: 1000,
      energyOutputJ: 700,
      warnings: ["RAPID_DECOMPRESSION_TRANSIENT"],
    });

    expect(result.pressure.maxAbsRateKPaPerS).toBe(10);
    expect(result.temperature.maxK).toBe(340);
    expect(result.mass.changeKg).toBeCloseTo(-0.5);
    expect(result.phase.maxQuality).toBe(1);
    expect(result.energy.balanceJ).toBe(300);
    expect(result.warnings).toContain("RAPID_DECOMPRESSION_TRANSIENT");
  });

  it("rejects non-monotonic time series", () => {
    expect(() => extractSimulationEvidence({
      simulationRunId: "SIM-002",
      modelVersion: "MODEL-1",
      parameterSetId: "PARAM-1",
      datasetIds: ["DATA-1"],
      pressureKPa: [{ timeS: 1, value: 100 }, { timeS: 1, value: 90 }],
      temperatureK: [{ timeS: 0, value: 300 }],
      massKg: [{ timeS: 0, value: 10 }],
    })).toThrow();
  });
});
