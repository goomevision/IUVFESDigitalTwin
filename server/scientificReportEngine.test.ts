import { describe, expect, it } from "vitest";
import { buildThreeLayerReport, rankLabActions, type ScientificClaim } from "./scientificReportEngine";

describe("three-layer scientific report", () => {
  const evidence: ScientificClaim = { id: "e1", layer: "EVIDENCE", statement: "Measured yield", status: "OBSERVED", sourceIds: ["lab-1"] };
  const estimate: ScientificClaim = { id: "h1", layer: "ESTIMATE", statement: "Possible resonance", status: "HYPOTHESIS", confidence: 0.3, sourceIds: ["model-1"] };
  const ai: ScientificClaim = { id: "a1", layer: "AI_ANALYSIS", statement: "Test 40-50 kHz next", status: "UNKNOWN", sourceIds: ["e1", "h1"] };

  it("keeps three layers separate", () => {
    const report = buildThreeLayerReport({ experimentId: "exp-1", evidence: [evidence], estimates: [estimate], aiAnalysis: [ai], labRecommendations: [] });
    expect(report.version).toBe("IUVFES-3L-1");
    expect(report.evidence[0].status).toBe("OBSERVED");
    expect(report.estimates[0].status).toBe("HYPOTHESIS");
  });

  it("rejects hypothesis disguised as evidence", () => {
    expect(() => buildThreeLayerReport({ experimentId: "exp-1", evidence: [{ ...evidence, status: "HYPOTHESIS" }], estimates: [], aiAnalysis: [], labRecommendations: [] })).toThrow();
  });

  it("ranks experiments by expected information gain", () => {
    const actions = rankLabActions([
      { id: "low", priority: "LOW", purpose: "PARAMETER_SWEEP", question: "q", proposedConditions: {}, expectedInformationGain: 0.2, preventsDuplicateTesting: true, dependsOn: [] },
      { id: "high", priority: "HIGH", purpose: "FALSIFICATION", question: "q", proposedConditions: {}, expectedInformationGain: 0.9, preventsDuplicateTesting: true, dependsOn: [] },
    ]);
    expect(actions[0].id).toBe("high");
  });
});
