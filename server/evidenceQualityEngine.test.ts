import { describe, expect, it } from "vitest";
import { assessEvidenceQuality } from "./evidenceQualityEngine";

describe("evidence quality engine", () => {
  it("requires uncertainty metadata", () => {
    const report = assessEvidenceQuality([{ evidenceId: "E1", parameter: "temperature", value: 10, unit: "degC" }]);
    expect(report.status).toBe("REVIEW_REQUIRED");
    expect(report.issues[0].code).toBe("MISSING_UNCERTAINTY");
  });

  it("flags an outlier candidate without deleting it", () => {
    const samples = [1, 1.1, 0.9, 1.05, 10].map((value, index) => ({ evidenceId: `E${index}`, parameter: "x", value, unit: "u", uncertainty: 0.01 }));
    const report = assessEvidenceQuality(samples);
    expect(report.status).toBe("REVIEW_REQUIRED");
    expect(report.issues.some((issue) => issue.code === "OUTLIER_CANDIDATE")).toBe(true);
    expect(report.sampleCount).toBe(5);
  });

  it("does not invent a result for an empty evidence set", () => {
    expect(assessEvidenceQuality([]).status).toBe("REVIEW_REQUIRED");
  });
});
