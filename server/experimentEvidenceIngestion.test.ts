import { describe, expect, it } from "vitest";
import { ingestExperimentEvidence } from "./experimentEvidenceIngestion";

describe("experiment evidence ingestion", () => {
  it("turns explicit observations into provenance-linked evidence", () => {
    const evidence = ingestExperimentEvidence({
      experimentId: "EXP-NILAM-001",
      materialId: "PATCHOULI-OIL",
      materialRevisionId: "v2",
      startedAt: "2026-08-10T00:00:00Z",
      operatorId: "OP-001",
      protocolId: "PROTOCOL-VAC-001",
      observations: [
        { parameter: "temperature", value: 10, unit: "degC", uncertainty: 0.2, condition: "start" },
        { parameter: "mass", value: 2, unit: "kg", uncertainty: 0.01, condition: "end" },
      ],
      rawEvidenceIds: ["RAW-001"],
    });
    expect(evidence).toHaveLength(2);
    expect(evidence[0].provenance).toBe("EXPERIMENT");
    expect(evidence[1].status).toBe("OBSERVED");
  });

  it("blocks records without raw evidence", () => {
    expect(() => ingestExperimentEvidence({
      experimentId: "EXP-1", materialId: "M", materialRevisionId: "v1", startedAt: "2026-08-10T00:00:00Z", operatorId: "OP", protocolId: "P", observations: [{ parameter: "temperature", value: 10, unit: "degC" }], rawEvidenceIds: [],
    })).toThrow();
  });
});
