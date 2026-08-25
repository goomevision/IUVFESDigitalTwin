import { describe, expect, it } from "vitest";
import {
  EMPTY_SCIENTIFIC_AUDIT_EVENTS,
  EMPTY_SCIENTIFIC_REPLAY_REFERENCE,
  getReconstructionBlockedReasons,
  getReproducibilityReadiness,
  isAuditTrailReconstructable,
  REPRODUCIBILITY_MATRIX,
} from "../client/src/lib/scientificAuditTrail";
import { EMPTY_EVIDENCE_INTEGRITY, EMPTY_EXPERIMENTAL_IDENTITY, getEvidenceIntegrityReadiness } from "../client/src/lib/experimentalIdentityIntegrity";
import { EXPERIMENTAL_COMPARISON_RECORDS, getComparisonReadiness } from "../client/src/lib/experimentalComparison";
import { LABORATORY_EVIDENCE_RECORDS } from "../client/src/lib/laboratoryEvidence";
import { getInstrumentRegistryEntry, getMeasurementUncertaintyBudget, getMetrologicalTraceabilityChain, hasVerifiedMetrologicalTraceability } from "../client/src/lib/instrumentRegistry";

describe("P23 scientific audit trail and reproducibility foundation", () => {
  it("keeps the audit trail and replay reference empty without generating experiment, session, frame, event, timeline, evidence, or dataset data", () => {
    expect(EMPTY_SCIENTIFIC_AUDIT_EVENTS).toEqual([]);
    expect(EMPTY_SCIENTIFIC_REPLAY_REFERENCE.experimentId.status).toBe("NOT LOADED");
    expect(EMPTY_SCIENTIFIC_REPLAY_REFERENCE.sessionId.status).toBe("NOT LOADED");
    expect(EMPTY_SCIENTIFIC_REPLAY_REFERENCE.frameReference.status).toBe("NOT LOADED");
    expect(EMPTY_SCIENTIFIC_REPLAY_REFERENCE.eventReference.status).toBe("NOT LOADED");
    expect(EMPTY_SCIENTIFIC_REPLAY_REFERENCE.datasetReference.status).toBe("NOT LOADED");
    expect(EMPTY_SCIENTIFIC_REPLAY_REFERENCE.integrityStatus).toBe("NOT LOADED");
  });

  it("keeps reproducibility below reproducible and explains why reconstruction is blocked", () => {
    expect(getReproducibilityReadiness()).toBe("PARTIAL");
    expect(isAuditTrailReconstructable()).toBe(false);
    expect(getReconstructionBlockedReasons()).toEqual([
      "LABORATORY DATA NOT LOADED", "EVIDENCE NOT VERIFIED", "DATASET REFERENCE MISSING",
      "FRAME HISTORY INCOMPLETE", "PROVENANCE INCOMPLETE", "INTEGRITY NOT VERIFIED",
    ]);
    expect(REPRODUCIBILITY_MATRIX.find(item => item.key === "LABORATORY_DATA")?.status).toBe("NOT LOADED");
    expect(REPRODUCIBILITY_MATRIX.find(item => item.key === "FRAME_HISTORY")?.status).toBe("NOT LOADED");
  });

  it("keeps P20–P22 empty and P21 comparison blocked without fake evidence, hash, verification, or validation", () => {
    expect(LABORATORY_EVIDENCE_RECORDS).toEqual([]);
    expect(EXPERIMENTAL_COMPARISON_RECORDS).toEqual([]);
    expect(getComparisonReadiness(EXPERIMENTAL_COMPARISON_RECORDS)).toBe("NOT READY");
    expect(EMPTY_EXPERIMENTAL_IDENTITY.experimentId.value).toBeUndefined();
    expect(EMPTY_EVIDENCE_INTEGRITY.contentHash.value).toBeUndefined();
    expect(getEvidenceIntegrityReadiness()).toBe("NOT READY");
  });

  it("retains simulation provenance and evidence-bound instrument, traceability, and uncertainty contracts", () => {
    const entry = getInstrumentRegistryEntry("IUVFES-SIM-ULTRA-01");
    expect(entry).toBeDefined();
    if (!entry) return;

    expect(entry.provenance).toBe("SIMULATION");
    expect(entry.measurementRange.value).toBeUndefined();
    expect(getMeasurementUncertaintyBudget(entry).availability).toBe("NOT AVAILABLE");
    expect(hasVerifiedMetrologicalTraceability(getMetrologicalTraceabilityChain(entry))).toBe(false);
  });
});
