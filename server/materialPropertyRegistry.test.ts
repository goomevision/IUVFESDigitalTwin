import { describe, expect, it } from "vitest";
import { getMaterial, registerMaterial } from "./materialPropertyRegistry";

describe("material property registry", () => {
  it("registers and retrieves a material with provenance", () => {
    const registry = registerMaterial({ version: "1.0.0", records: [] }, {
      materialId: "WATER-PURE",
      name: "Water",
      cas: "7732-18-5",
      basis: "PURE_COMPONENT",
      properties: { molecularWeightGPerMol: 18.0153 },
      sources: [{
        sourceId: "NIST-SRD69",
        citation: "NIST Chemistry WebBook, SRD 69",
        retrievedAt: "2026-08-10",
        confidence: "PRIMARY",
      }],
      warnings: [],
    });

    expect(getMaterial(registry, "WATER-PURE").cas).toBe("7732-18-5");
    expect(getMaterial(registry, "WATER-PURE").sources[0].sourceId).toBe("NIST-SRD69");
  });

  it("rejects records without provenance", () => {
    expect(() => registerMaterial({ version: "1.0.0", records: [] }, {
      materialId: "NO-SOURCE",
      name: "Unknown",
      basis: "MIXTURE",
      properties: {},
      sources: [],
      warnings: [],
    })).toThrow();
  });
});
