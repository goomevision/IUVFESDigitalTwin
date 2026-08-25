import { describe, expect, it } from "vitest";
import { resolveScientificRecordIdentity } from "./scientificRecordIdentity";

describe("resolveScientificRecordIdentity", () => {
  it("preserves an existing IUVFES experiment id as the scientific provenance key", () => {
    const identity = resolveScientificRecordIdentity(" experiment-123 ");

    expect(identity).toEqual({
      sourceExperimentId: "experiment-123",
      experimentId: "experiment-123",
      researchExperimentId: "IUVFES-EXP-experiment-123",
    });
  });

  it("uses an opaque generated identity only for legacy callers without a source experiment", () => {
    const identity = resolveScientificRecordIdentity(undefined, () => "generated-456");

    expect(identity).toEqual({
      sourceExperimentId: undefined,
      experimentId: "generated-456",
      researchExperimentId: "IUVFES-EXP-generated-456",
    });
  });
});
