import { describe, expect, it } from "vitest";
import { enrichMaterialComposition, registerMaterialDiscovery } from "./materialDiscoveryRegistry";

describe("material discovery registry", () => {
  const base = {
    discoveryId: "DISC-NILAM-001",
    materialId: "patchouli-oil",
    sampleId: "BATCH-A",
    componentName: "Component-X",
    evidenceKind: "OBSERVED" as const,
    status: "OBSERVED" as const,
    method: "GC-MS",
    properties: { density: { value: 900, unit: "kg/m3", provenanceId: "PROV-1" } },
    provenanceIds: ["PROV-1"],
    discoveredAt: "2026-08-10T00:00:00Z",
  };

  it("accepts observed discoveries with provenance", () => {
    expect(registerMaterialDiscovery(base).discoveryId).toBe("DISC-NILAM-001");
  });

  it("does not let inferred evidence masquerade as validated", () => {
    expect(() => registerMaterialDiscovery({ ...base, evidenceKind: "INFERRED", status: "VALIDATED" })).toThrow();
  });

  it("enriches an existing component without deleting prior provenance", () => {
    const result = enrichMaterialComposition([base], {
      ...base,
      discoveryId: "DISC-NILAM-002",
      properties: { vaporPressure: { value: 1.2, unit: "kPa", provenanceId: "PROV-2" } },
      provenanceIds: ["PROV-2"],
    });
    expect(result).toHaveLength(1);
    expect(result[0].properties.vaporPressure.value).toBe(1.2);
    expect(result[0].provenanceIds).toEqual(["PROV-1", "PROV-2"]);
  });
});
