import { describe, expect, it } from "vitest";
import { experimentGuide, methods, overviewFlow, scientificStatus, whyThisValues } from "../client/src/lib/scientificKnowledge";

describe("P14 scientific knowledge content", () => {
  it("keeps the documented IUVFES overview chain intact", () => {
    expect(overviewFlow).toEqual(["Input", "Material", "Experiment", "Simulation", "CausalFrame", "3D Twin", "Analysis", "Evidence", "Laboratory", "Knowledge", "Next Experiment"]);
  });

  it("labels unimplemented AI, uncertainty, and laboratory-comparison capabilities explicitly", () => {
    expect(methods.find(method => method.id === "ai-analysis")?.availability).toBe("NOT AVAILABLE");
    expect(methods.find(method => method.id === "uncertainty")?.output).toBe("NOT AVAILABLE.");
    expect(methods.find(method => method.id === "laboratory-comparison")?.availability).toBe("FUTURE CAPABILITY");
    expect(experimentGuide.find(([step]) => step === "Review AI Analysis")?.[1]).toBe("NOT AVAILABLE");
  });

  it("preserves UNKNOWN and the simulation-versus-laboratory boundary", () => {
    expect(scientificStatus.find(([label]) => label === "UNKNOWN")?.[1]).toContain("tidak diisi");
    expect(scientificStatus.find(([label]) => label === "SIMULATION")?.[1]).toContain("ClosedLoopSimulationEngine");
    expect(scientificStatus.find(([label]) => label === "LABORATORY")?.[1]).toContain("dataset laboratorium");
  });

  it("binds Why-this-value explanations to CausalFrame fields rather than invented runtime values", () => {
    expect(whyThisValues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "sensorAfter.temperatureC", classification: "SIMULATION" }),
      expect.objectContaining({ field: "actuatorLevels.heater", classification: "SIMULATION" }),
      expect.objectContaining({ field: "timestampSeconds", classification: "SIMULATION" }),
    ]));
    expect(whyThisValues.every(item => !Object.hasOwn(item, "value") && !Object.hasOwn(item, "reading"))).toBe(true);
  });
});
