import { describe, expect, it } from "vitest";
import {
  COMPARISON_READINESS_GATES,
  COMPARISON_RECORD_FIELD_DEFINITIONS,
  EXPERIMENTAL_COMPARISON_RECORDS,
  getComparisonBlockedReasons,
  getComparisonReadiness,
  isComparisonAvailable,
} from "../client/src/lib/experimentalComparison";
import { LABORATORY_EVIDENCE_RECORDS } from "../client/src/lib/laboratoryEvidence";
import { getInstrumentRegistryEntry, getMeasurementUncertaintyBudget, getMetrologicalTraceabilityChain, hasVerifiedMetrologicalTraceability } from "../client/src/lib/instrumentRegistry";

describe("P21 experimental dataset and simulation comparison foundation", () => {
  it("declares the complete comparison contract without creating a comparison, measurement, sample, or laboratory dataset", () => {
    expect(COMPARISON_RECORD_FIELD_DEFINITIONS.map(field => field.key)).toEqual([
      "comparisonId", "simulationReference", "measurementReference", "experimentId", "sampleId", "instrumentId",
      "measurementChannel", "simulationField", "measurementField", "unit", "timestampAlignment", "sampleAlignment",
      "instrumentAlignment", "calibrationStatus", "traceabilityStatus", "uncertaintyStatus", "provenanceStatus",
    ]);
    expect(EXPERIMENTAL_COMPARISON_RECORDS).toEqual([]);
    expect(LABORATORY_EVIDENCE_RECORDS).toEqual([]);
    expect(getComparisonReadiness(EXPERIMENTAL_COMPARISON_RECORDS)).toBe("NOT READY");
  });

  it("keeps every readiness prerequisite unloaded and comparison unavailable without evidence", () => {
    COMPARISON_READINESS_GATES.forEach(gate => expect(gate.status).toBe("NOT LOADED"));
    expect(getComparisonBlockedReasons(EXPERIMENTAL_COMPARISON_RECORDS)).toEqual([
      "NO LABORATORY DATA LOADED", "COMPARISON NOT READY", "REQUIRED EVIDENCE MISSING",
    ]);
    expect(EXPERIMENTAL_COMPARISON_RECORDS.some(isComparisonAvailable)).toBe(false);
  });

  it("preserves P17–P20 scientific boundaries without converting simulation into measurement or validation", () => {
    const entry = getInstrumentRegistryEntry("IUVFES-SIM-PRESS-01");
    expect(entry).toBeDefined();
    if (!entry) return;

    expect(entry.provenance).toBe("SIMULATION");
    expect(entry.measurementRange.value).toBeUndefined();
    expect(getMeasurementUncertaintyBudget(entry).availability).toBe("NOT AVAILABLE");
    expect(hasVerifiedMetrologicalTraceability(getMetrologicalTraceabilityChain(entry))).toBe(false);
  });
});
