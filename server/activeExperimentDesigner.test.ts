import { describe, expect, it } from "vitest";
import { rankExperimentCandidates } from "./activeExperimentDesigner";

describe("active experiment designer", () => {
  it("prioritizes experiments targeting sensitive uncertain parameters", () => {
    const result = rankExperimentCandidates(
      [
        { id: "D1", parameter: "vaporPressure", normalizedUncertainty: 0.8, sensitivity: 1.5, evidenceGap: 0.9, safetyWeight: 0.1 },
        { id: "D2", parameter: "density", normalizedUncertainty: 0.1, sensitivity: 0.2, evidenceGap: 0.2 },
      ],
      [
        { id: "EXP-VP", objective: "Measure vapor pressure", parameters: ["vaporPressure"], expectedInformationGain: 0.9, feasibility: 0.9, safety: 1 },
        { id: "EXP-D", objective: "Measure density", parameters: ["density"], expectedInformationGain: 0.5, feasibility: 0.9, safety: 1 },
      ],
    );
    expect(result[0].id).toBe("EXP-VP");
    expect(result[0].rationale[0]).toContain("vaporPressure");
  });

  it("does not invent a benefit when no driver is linked", () => {
    const result = rankExperimentCandidates([], [{ id: "EXP-1", objective: "Unknown", parameters: ["unknown"], expectedInformationGain: 0, feasibility: 1, safety: 1 }]);
    expect(result[0].priorityScore).toBe(0);
  });
});
