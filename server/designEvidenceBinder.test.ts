import { describe, expect, it } from "vitest";
import { bindSimulationEvidence } from "./designEvidenceBinder";

describe("design evidence binder", () => {
  it("marks a complete evidence chain traceable", () => {
    const result = bindSimulationEvidence({
      simulationRunId: "SIM-001",
      validationReportId: "VAL-001",
      datasetIds: ["DATA-001"],
      hardwareModelVersion: "HW-1",
      modelVersion: "PHYS-1",
      equationIds: ["EQ-001"],
      keyOutputs: { maxPressureKPa: 80, maxTemperatureC: 120 },
      assumptions: ["Ideal-gas vacuum transient for preliminary design."],
      uncertainties: ["Pump curve not yet calibrated."],
    });

    expect(result.evidenceStatus).toBe("TRACEABLE");
    expect(result.blockers).toHaveLength(0);
  });

  it("blocks incomplete evidence", () => {
    const result = bindSimulationEvidence({
      simulationRunId: "SIM-001",
      validationReportId: "",
      datasetIds: [],
      hardwareModelVersion: "HW-1",
      modelVersion: "PHYS-1",
      equationIds: [],
      keyOutputs: {},
      assumptions: [],
      uncertainties: [],
    });

    expect(result.evidenceStatus).toBe("INCOMPLETE");
    expect(result.blockers.length).toBeGreaterThanOrEqual(3);
  });
});
