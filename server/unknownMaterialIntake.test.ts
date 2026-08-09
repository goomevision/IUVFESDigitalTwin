import { describe, expect, it } from "vitest";
import { intakeUnknownMaterial } from "./unknownMaterialIntake";

describe("unknown material intake", () => {
  const base = {
    materialId: "NEW-OIL-001",
    name: "Unknown Oil",
    basis: "MIXTURE" as const,
    values: {
      densityKgPerM3: 900,
      heatCapacityJPerKgK: 2000,
      latentHeatJPerKg: 250000,
      vaporPressurePa: 100,
    },
    units: {
      densityKgPerM3: "kg/m³",
      heatCapacityJPerKgK: "J/(kg·K)",
      latentHeatJPerKg: "J/kg",
      vaporPressurePa: "Pa",
    },
    methods: {
      densityKgPerM3: "laboratory measurement",
      heatCapacityJPerKgK: "laboratory measurement",
      latentHeatJPerKg: "literature",
      vaporPressurePa: "laboratory measurement",
    },
    sourceRefs: {
      densityKgPerM3: "LAB-001",
      heatCapacityJPerKgK: "LAB-002",
      latentHeatJPerKg: "LIT-001",
      vaporPressurePa: "LAB-003",
    },
    operatorId: "operator-1",
    submittedAt: "2026-08-10T00:00:00Z",
  };

  it("returns READY_FOR_REVIEW when required evidence fields are complete", () => {
    const result = intakeUnknownMaterial(base, []);
    expect(result.status).toBe("READY_FOR_REVIEW");
    expect(result.missing).toHaveLength(0);
  });

  it("does not permit an unknown material to silently omit required evidence", () => {
    const incomplete = { ...base, values: { densityKgPerM3: 900 }, units: { densityKgPerM3: "kg/m³" }, methods: { densityKgPerM3: "estimate" }, sourceRefs: { densityKgPerM3: "OP-001" } };
    const result = intakeUnknownMaterial(incomplete, []);
    expect(result.status).toBe("PARTIAL");
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it("blocks duplicate material IDs from silent overwrite", () => {
    const result = intakeUnknownMaterial(base, ["NEW-OIL-001"]);
    expect(result.status).toBe("KNOWN");
  });
});
