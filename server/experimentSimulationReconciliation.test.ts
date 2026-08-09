import { describe, expect, it } from "vitest";
import { reconcileExperimentToSimulation } from "./experimentSimulationReconciliation";

describe("experiment simulation reconciliation", () => {
  it("matches measurements to the nearest physical simulation time", () => {
    const result = reconcileExperimentToSimulation(
      [{ physicalTimeS: 10.2, parameter: "temperature", value: 12, unit: "degC" }],
      [
        { physicalTimeS: 9, parameter: "temperature", value: 11, unit: "degC" },
        { physicalTimeS: 10, parameter: "temperature", value: 11.8, unit: "degC" },
        { physicalTimeS: 12, parameter: "temperature", value: 13, unit: "degC" },
      ],
    );
    expect(result[0].physicalTimeS).toBe(10);
    expect(result[0].absoluteError).toBeCloseTo(0.2);
  });
});
