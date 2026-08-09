import { describe, expect, it } from "vitest";
import { compareSimulationToExperiment } from "./comparisonEngine";

describe("compareSimulationToExperiment", () => {
  it("interpolates simulation values and calculates residual metrics", () => {
    const report = compareSimulationToExperiment({
      experimental: [
        { parameter: "temperature", timeSeconds: 5, value: 50, qualityFlag: "VALIDATED" },
        { parameter: "temperature", timeSeconds: 15, value: 70, qualityFlag: "VALIDATED" },
      ],
      simulation: [
        { timeSeconds: 0, values: { temperature: 40 } },
        { timeSeconds: 10, values: { temperature: 60 } },
        { timeSeconds: 20, values: { temperature: 80 } },
      ],
      tolerances: { temperature: { maxBias: 0, maxMae: 0, maxRmse: 0, maxAbsoluteError: 0 } },
    });

    expect(report.verdict).toBe("PASS");
    expect(report.matchedObservations).toBe(2);
    expect(report.parameters[0].bias).toBe(0);
    expect(report.parameters[0].mae).toBe(0);
    expect(report.parameters[0].rmse).toBe(0);
  });

  it("rejects a parameter when residuals exceed tolerance", () => {
    const report = compareSimulationToExperiment({
      experimental: [{ parameter: "pressure", timeSeconds: 10, value: 100, qualityFlag: "VALIDATED" }],
      simulation: [{ timeSeconds: 0, values: { pressure: 100 } }, { timeSeconds: 10, values: { pressure: 130 } }],
      tolerances: { pressure: { maxMae: 5 } },
    });

    expect(report.verdict).toBe("FAIL");
    expect(report.parameters[0].maxAbsoluteError).toBe(30);
  });

  it("does not assign a scientific verdict without tolerance", () => {
    const report = compareSimulationToExperiment({
      experimental: [{ parameter: "yield", timeSeconds: 1, value: 5, qualityFlag: "VALIDATED" }],
      simulation: [{ timeSeconds: 0, values: { yield: 4 } }, { timeSeconds: 2, values: { yield: 6 } }],
    });

    expect(report.verdict).toBe("INCONCLUSIVE");
    expect(report.parameters[0].mae).toBe(0);
  });

  it("excludes rejected observations and reports out-of-domain timestamps", () => {
    const report = compareSimulationToExperiment({
      experimental: [
        { parameter: "temperature", timeSeconds: 1, value: 30, qualityFlag: "REJECTED" },
        { parameter: "temperature", timeSeconds: 5, value: 50, qualityFlag: "VALIDATED" },
      ],
      simulation: [{ timeSeconds: 0, values: { temperature: 40 } }, { timeSeconds: 2, values: { temperature: 44 } }],
      tolerances: { temperature: { maxMae: 5 } },
    });

    expect(report.unmatchedObservations).toBe(2);
    expect(report.parameters[0].sampleCount).toBe(0);
    expect(report.parameters[0].verdict).toBe("INCONCLUSIVE");
  });
});
