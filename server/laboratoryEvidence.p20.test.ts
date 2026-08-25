import { describe, expect, it } from "vitest";
import {
  EVIDENCE_LIFECYCLE,
  EVIDENCE_RECORD_FIELD_DEFINITIONS,
  getEvidenceCompleteness,
  getEvidenceLifecycleStatus,
  isEvidenceVerified,
  LABORATORY_EVIDENCE_RECORDS,
} from "../client/src/lib/laboratoryEvidence";
import { getInstrumentRegistryEntry, getMeasurementUncertaintyBudget, getMetrologicalTraceabilityChain, hasVerifiedMetrologicalTraceability } from "../client/src/lib/instrumentRegistry";

describe("P20 laboratory evidence and data ingestion foundation", () => {
  it("declares the required evidence contract fields without loading synthetic evidence, laboratory values, or identifiers", () => {
    expect(EVIDENCE_RECORD_FIELD_DEFINITIONS.map(field => field.key)).toEqual([
      "evidenceId", "experimentId", "sampleId", "instrumentId", "measurementId", "datasetId",
      "source", "sourceType", "receivedAt", "measurementTimestamp", "unit", "value", "uncertainty",
      "calibrationReference", "laboratoryReference", "referenceStandard",
    ]);
    expect(LABORATORY_EVIDENCE_RECORDS).toEqual([]);
    expect(getEvidenceCompleteness(LABORATORY_EVIDENCE_RECORDS)).toBe("NOT READY");
  });

  it("keeps every lifecycle stage unloaded and never emits VERIFIED without an evidence record", () => {
    EVIDENCE_LIFECYCLE.forEach(stage => {
      expect(getEvidenceLifecycleStatus(LABORATORY_EVIDENCE_RECORDS, stage)).toBe("NOT LOADED");
    });
    expect(LABORATORY_EVIDENCE_RECORDS.some(isEvidenceVerified)).toBe(false);
  });

  it("preserves P17–P19 evidence boundaries: simulation does not become measured, unknown is not zero, and traceability remains unverified", () => {
    const entry = getInstrumentRegistryEntry("IUVFES-SIM-TEMP-01");
    expect(entry).toBeDefined();
    if (!entry) return;

    expect(entry.provenance).toBe("SIMULATION");
    expect(entry.measurementRange.value).toBeUndefined();
    expect(entry.measurementUncertainty.value).toBeUndefined();
    expect(getMeasurementUncertaintyBudget(entry).availability).toBe("NOT AVAILABLE");
    expect(hasVerifiedMetrologicalTraceability(getMetrologicalTraceabilityChain(entry))).toBe(false);
  });
});
