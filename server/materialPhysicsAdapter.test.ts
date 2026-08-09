import { describe, expect, it } from "vitest";
import { resolveMaterialPhysics } from "./materialPhysicsAdapter";

describe("material physics adapter", () => {
  it("does not invent water properties", () => {
    const result = resolveMaterialPhysics({
      materialId: "MAT-WATER-H2O",
      state: "LIQUID",
      temperatureC: 80,
      pressureKPa: 101.325,
    });

    expect(result.status).toBe("PARTIAL");
    expect(result.properties).toEqual({});
    expect(result.missingProperties).toContain("resolved_cp");
  });

  it("keeps patchouli as partial until condition-dependent data are available", () => {
    const result = resolveMaterialPhysics({
      materialId: "MAT-PATCHOULI-LEAF-POGOSTEMON-CABLIN",
      state: "DRIED",
      temperatureC: 70,
      moistureFraction: 0.15,
    });

    expect(result.status).toBe("PARTIAL");
    expect(result.missingProperties).toContain("validated_process_kinetics");
  });

  it("does not expose unsupported materials as valid physics", () => {
    const result = resolveMaterialPhysics({
      materialId: "MAT-UNKNOWN",
      state: "SOLID",
    });

    expect(result.status).toBe("DATA_GAP");
    expect(result.missingProperties).toContain("material_registration");
  });
});
