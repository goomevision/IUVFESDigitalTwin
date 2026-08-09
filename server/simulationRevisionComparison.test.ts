import { describe, expect, it } from "vitest";
import { compareSimulationRevisionResults } from "./simulationRevisionComparison";

describe("simulation revision comparison", () => {
  it("reports absolute and relative changes caused by a model revision", () => {
    const deltas = compareSimulationRevisionResults(
      { simulationId: "SIM-1", materialRevisionId: "v1", metrics: [{ name: "evaporatedMass", value: 2, unit: "kg" }, { name: "time", value: 100, unit: "s" }] },
      { simulationId: "SIM-2", materialRevisionId: "v2", metrics: [{ name: "evaporatedMass", value: 2.5, unit: "kg" }, { name: "time", value: 110, unit: "s" }] },
    );
    expect(deltas[0].absoluteDelta).toBe(0.5);
    expect(deltas[0].relativeDelta).toBe(0.25);
  });
});
