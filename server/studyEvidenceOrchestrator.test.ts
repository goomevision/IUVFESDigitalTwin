import { describe, expect, it } from "vitest";
import { integrateSimulationIntoStudy } from "./studyEvidenceOrchestrator";

describe("study evidence orchestrator", () => {
  it("integrates simulation evidence and sensitivity into one study", () => {
    const state = integrateSimulationIntoStudy(
      { studyId: "STUDY-001", simulationEvidence: [], sensitivityEvidence: [] },
      {
        simulationRunId: "SIM-001",
        modelVersion: "MODEL-1",
        parameterSetId: "PARAM-1",
        datasetIds: ["DATA-1"],
        pressureKPa: [{ timeS: 0, value: 100 }, { timeS: 1, value: 90 }],
        temperatureK: [{ timeS: 0, value: 300 }, { timeS: 1, value: 310 }],
        massKg: [{ timeS: 0, value: 2 }, { timeS: 1, value: 1.9 }],
        energyInputJ: 100,
        energyOutputJ: 80,
      },
      [{ id: "heaterPower", nominal: 100, min: 80, max: 120 }],
      (_id, value) => value * 0.5,
    );

    expect(state.simulationEvidence).toHaveLength(1);
    expect(state.simulationEvidence[0].simulationRunId).toBe("SIM-001");
    expect(state.sensitivityEvidence).toHaveLength(1);
    expect(state.lastUpdatedSimulationRunId).toBe("SIM-001");
  });
});
