import { describe, expect, it } from "vitest";
import { promoteDiscoveryToMaterialModel } from "./materialKnowledgePromotion";

describe("material knowledge promotion", () => {
  const discovery = {
    discoveryId: "DISC-NILAM-001",
    materialId: "PATCHOULI-OIL",
    componentId: "COMP-X",
    status: "OBSERVED" as const,
    evidenceIds: ["GCMS-001"],
  };

  it("promotes only when required properties are validated", () => {
    const result = promoteDiscoveryToMaterialModel(
      discovery,
      [
        { propertyId: "density", value: 900, unit: "kg/m3", sourceId: "LAB-001", provenanceId: "PROV-001", status: "VALIDATED" },
        { propertyId: "cp", value: 2000, unit: "J/kg/K", sourceId: "LAB-001", provenanceId: "PROV-002", status: "VALIDATED" },
      ],
      ["density", "cp"],
    );
    expect(result.promoted).toBe(true);
    expect(result.acceptedProperties).toHaveLength(2);
  });

  it("does not promote inferred discoveries", () => {
    const result = promoteDiscoveryToMaterialModel(
      { ...discovery, status: "INFERRED" },
      [{ propertyId: "density", value: 900, unit: "kg/m3", sourceId: "AI", provenanceId: "PROV-AI", status: "VALIDATED" }],
      ["density"],
    );
    expect(result.promoted).toBe(false);
  });

  it("reports missing required evidence", () => {
    const result = promoteDiscoveryToMaterialModel(discovery, [], ["density", "vaporPressure"]);
    expect(result.promoted).toBe(false);
    expect(result.blockers).toHaveLength(2);
  });
});
