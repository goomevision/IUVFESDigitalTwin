import { describe, expect, it } from "vitest";
import {
  CANONICAL_HASH_MECHANISM,
  EMPTY_EVIDENCE_INTEGRITY,
  EMPTY_EXPERIMENTAL_IDENTITY,
  getEvidenceIntegrityReadiness,
  getExperimentalIdentityReadiness,
  getP20IdentityIntegrationStatus,
  getP21IdentityIntegrationBlocker,
  isEvidenceIntegrityVerified,
} from "../client/src/lib/experimentalIdentityIntegrity";
import { EXPERIMENTAL_COMPARISON_RECORDS, getComparisonReadiness } from "../client/src/lib/experimentalComparison";
import { LABORATORY_EVIDENCE_RECORDS } from "../client/src/lib/laboratoryEvidence";
import { getInstrumentRegistryEntry, getMeasurementUncertaintyBudget, getMetrologicalTraceabilityChain, hasVerifiedMetrologicalTraceability } from "../client/src/lib/instrumentRegistry";

describe("P22 experimental identity and evidence integrity foundation", () => {
  it("keeps every empty identity field unloaded without creating experiment, sample, session, measurement, dataset, evidence, or provenance identifiers", () => {
    const fields = [
      EMPTY_EXPERIMENTAL_IDENTITY.experimentId, EMPTY_EXPERIMENTAL_IDENTITY.sampleId, EMPTY_EXPERIMENTAL_IDENTITY.simulationRunId,
      EMPTY_EXPERIMENTAL_IDENTITY.measurementId, EMPTY_EXPERIMENTAL_IDENTITY.instrumentId, EMPTY_EXPERIMENTAL_IDENTITY.calibrationId,
      EMPTY_EXPERIMENTAL_IDENTITY.datasetId, EMPTY_EXPERIMENTAL_IDENTITY.evidenceId, EMPTY_EXPERIMENTAL_IDENTITY.provenanceId,
      EMPTY_EXPERIMENTAL_IDENTITY.timestamp, EMPTY_EXPERIMENTAL_IDENTITY.sourceType,
    ];
    fields.forEach(field => {
      expect(field.status).toBe("NOT LOADED");
      expect(field.value).toBeUndefined();
    });
    expect(getExperimentalIdentityReadiness()).toBe("NOT READY");
  });

  it("keeps empty evidence integrity not loaded and never fabricates a hash or verified state", () => {
    expect(EMPTY_EVIDENCE_INTEGRITY.integrityStatus).toBe("NOT LOADED");
    expect(EMPTY_EVIDENCE_INTEGRITY.verificationStatus).toBe("NOT LOADED");
    expect(EMPTY_EVIDENCE_INTEGRITY.contentHash.value).toBeUndefined();
    expect(EMPTY_EVIDENCE_INTEGRITY.hashAlgorithm.value).toBeUndefined();
    expect(getEvidenceIntegrityReadiness()).toBe("NOT READY");
    expect(isEvidenceIntegrityVerified()).toBe(false);
    expect(CANONICAL_HASH_MECHANISM.algorithm).toBe("SHA-256");
    expect(CANONICAL_HASH_MECHANISM.references).toHaveLength(3);
  });

  it("keeps P20 and P21 evidence-bound and comparison blocked without loaded evidence", () => {
    expect(LABORATORY_EVIDENCE_RECORDS).toEqual([]);
    expect(EXPERIMENTAL_COMPARISON_RECORDS).toEqual([]);
    expect(getP20IdentityIntegrationStatus()).toBe("NOT LOADED");
    expect(getP21IdentityIntegrationBlocker()).toBe("IDENTITY INCOMPLETE");
    expect(getComparisonReadiness(EXPERIMENTAL_COMPARISON_RECORDS)).toBe("NOT READY");
  });

  it("retains P17–P19 scientific authority and never converts simulation channels into measured evidence", () => {
    const entry = getInstrumentRegistryEntry("IUVFES-SIM-TEMP-01");
    expect(entry).toBeDefined();
    if (!entry) return;

    expect(entry.provenance).toBe("SIMULATION");
    expect(entry.measurementUncertainty.value).toBeUndefined();
    expect(getMeasurementUncertaintyBudget(entry).availability).toBe("NOT AVAILABLE");
    expect(hasVerifiedMetrologicalTraceability(getMetrologicalTraceabilityChain(entry))).toBe(false);
  });
});
