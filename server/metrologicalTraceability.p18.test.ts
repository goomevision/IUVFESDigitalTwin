import { describe, expect, it } from "vitest";
import {
  getInstrumentRegistryEntry,
  getMetrologicalTraceabilityChain,
  hasVerifiedMetrologicalTraceability,
} from "../client/src/lib/instrumentRegistry";

describe("P18 metrological traceability foundation", () => {
  it("declares every required node without fabricating metrological evidence", () => {
    const entry = getInstrumentRegistryEntry("IUVFES-SIM-TEMP-01");
    expect(entry).toBeDefined();
    if (!entry) return;

    const chain = getMetrologicalTraceabilityChain(entry);
    expect(chain.map(node => node.kind)).toEqual([
      "INSTRUMENT",
      "CALIBRATION_CERTIFICATE",
      "REFERENCE_STANDARD",
      "CALIBRATION_LABORATORY",
      "MEASUREMENT_RESULT",
      "EVIDENCE_PROVENANCE",
    ]);
    expect(chain.find(node => node.kind === "INSTRUMENT")?.identifierReference).toBe(entry.id);
    expect(chain.find(node => node.kind === "CALIBRATION_CERTIFICATE")?.status).toBe("NOT LOADED");
    expect(chain.find(node => node.kind === "REFERENCE_STANDARD")?.status).toBe("NOT LOADED");
    expect(chain.find(node => node.kind === "CALIBRATION_LABORATORY")?.status).toBe("NOT LOADED");
  });

  it("does not misclassify CausalFrame simulation provenance as measurement or verified traceability", () => {
    const entry = getInstrumentRegistryEntry("IUVFES-SIM-PRESS-01");
    expect(entry).toBeDefined();
    if (!entry) return;

    const chain = getMetrologicalTraceabilityChain(entry);
    const measurement = chain.find(node => node.kind === "MEASUREMENT_RESULT");
    const evidence = chain.find(node => node.kind === "EVIDENCE_PROVENANCE");

    expect(measurement?.status).toBe("NOT APPLICABLE");
    expect(measurement?.provenance).toBe("SIMULATION");
    expect(evidence?.status).toBe("NOT APPLICABLE");
    expect(evidence?.interpretationLimit).toContain("not metrological evidence");
    expect(hasVerifiedMetrologicalTraceability(chain)).toBe(false);
  });

  it("keeps unknown physical records absent rather than creating identifiers or standards", () => {
    const entry = getInstrumentRegistryEntry("IUVFES-SIM-TRAP-TEMP-02");
    expect(entry).toBeDefined();
    if (!entry) return;

    const chain = getMetrologicalTraceabilityChain(entry);
    const unloaded = chain.filter(node => node.status === "NOT LOADED");
    expect(unloaded).toHaveLength(3);
    unloaded.forEach(node => expect(node.identifierReference).toBe("NOT LOADED"));
  });
});
