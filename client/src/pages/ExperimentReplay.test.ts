import { describe, expect, it } from "vitest";
import { buildReplayEvidenceCanonicalBody } from "./ExperimentReplay";

describe("buildReplayEvidenceCanonicalBody", () => {
  it("keeps the hashed evidence body stable by excluding export-time metadata", () => {
    const frames = [{ step: 4, raw: { step: 4, timestampSeconds: 4 } }] as never;
    const first = JSON.stringify(buildReplayEvidenceCanonicalBody("experiment-1", frames));
    const second = JSON.stringify(buildReplayEvidenceCanonicalBody("experiment-1", frames));

    expect(second).toBe(first);
    expect(first).not.toContain("exportedAt");
  });
});
