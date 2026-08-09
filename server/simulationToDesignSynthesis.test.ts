import { describe, expect, it } from "vitest";
import { synthesizeDesignInputs } from "./simulationToDesignSynthesis";

describe("simulation to design synthesis", () => {
  const evidence = {
    simulationRunId: "SIM-001",
    validationReportId: "VAL-001",
    hardwareModelVersion: "HW-1",
    datasetIds: ["DATA-001"],
    materialIds: ["MAT-001"],
    peakAbsolutePressureMPa: 0.2,
    minimumAbsolutePressureKPa: 5,
    peakTemperatureC: 120,
    minimumTemperatureC: 25,
    peakHeatingPowerW: 5000,
    peakCoolingPowerW: 2500,
    maximumPressureRateKPaPerS: 2,
    maximumTemperatureRateCPerS: 1,
    safetyEvents: [],
    acceptanceCriteriaSatisfied: true,
  };

  it("maps validated simulation envelope to controlled design inputs", () => {
    const result = synthesizeDesignInputs(evidence);
    expect(result.status).toBe("ENGINEERING_REVIEW_REQUIRED");
    expect(result.designInputs.designPressureMPa).toBe(0.2);
    expect(result.designInputs.designTemperatureC).toBe(120);
    expect(result.designInputs.heatingPowerW).toBe(5000);
  });

  it("blocks synthesis when safety events remain", () => {
    const result = synthesizeDesignInputs({ ...evidence, safetyEvents: ["RAPID_PRESSURE_RISE_TRANSIENT"] });
    expect(result.status).toBe("BLOCKED");
    expect(result.blockers).toContain("Simulation contains safety events requiring engineering review.");
  });

  it("blocks synthesis when acceptance criteria are not satisfied", () => {
    const result = synthesizeDesignInputs({ ...evidence, acceptanceCriteriaSatisfied: false });
    expect(result.status).toBe("BLOCKED");
  });
});
