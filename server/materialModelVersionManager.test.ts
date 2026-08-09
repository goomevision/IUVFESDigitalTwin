import { describe, expect, it } from "vitest";
import { compareMaterialModelRevisions, createMaterialModelRevision } from "./materialModelVersionManager";

describe("material model version manager", () => {
  const v1 = {
    revisionId: "PATCHOULI-v1",
    materialId: "PATCHOULI-OIL",
    createdAt: "2026-08-10T00:00:00Z",
    propertyEvidenceIds: ["DENSITY-001"],
    compositionEvidenceIds: ["GCMS-001"],
    status: "VALIDATED" as const,
  };

  it("creates a revision only when its parent exists", () => {
    expect(createMaterialModelRevision(v1, [])).toEqual(v1);
    expect(() => createMaterialModelRevision({ ...v1, revisionId: "v2", parentRevisionId: "missing" }, [v1])).toThrow();
  });

  it("compares new evidence without rewriting the old revision", () => {
    const v2 = { ...v1, revisionId: "PATCHOULI-v2", parentRevisionId: v1.revisionId, propertyEvidenceIds: ["DENSITY-001", "VAPOR-P-002"], compositionEvidenceIds: ["GCMS-001", "GCMS-002"] };
    const comparison = compareMaterialModelRevisions(v1, v2, "new GC-MS finding and vapor-pressure evidence");
    expect(comparison.changedPropertyEvidenceIds).toEqual(["VAPOR-P-002"]);
    expect(comparison.changedCompositionEvidenceIds).toEqual(["GCMS-002"]);
    expect(v1.propertyEvidenceIds).toEqual(["DENSITY-001"]);
  });
});
