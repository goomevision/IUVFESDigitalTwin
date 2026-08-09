export type MaterialPhysicsAdapterStatus = "SUPPORTED" | "PARTIAL" | "DATA_GAP";

export type MaterialPhysicsRequest = {
  materialId: string;
  state: string;
  temperatureC?: number;
  pressureKPa?: number;
  moistureFraction?: number;
};

export type MaterialPhysicsResult = {
  materialId: string;
  state: string;
  status: MaterialPhysicsAdapterStatus;
  properties: Record<string, number | string | null>;
  missingProperties: string[];
  notes: string[];
};

/**
 * Conservative boundary between SMKB evidence and process physics.
 *
 * This adapter deliberately does not invent thermophysical values. A property
 * is exposed to a process model only when the current catalog contains an
 * adequate evidence-backed value/model. Missing values remain DATA_GAP.
 */
export function resolveMaterialPhysics(
  request: MaterialPhysicsRequest,
): MaterialPhysicsResult {
  const base = {
    materialId: request.materialId,
    state: request.state,
    status: "DATA_GAP" as MaterialPhysicsAdapterStatus,
    properties: {},
    missingProperties: [] as string[],
    notes: [] as string[],
  };

  switch (request.materialId) {
    case "MAT-WATER-H2O":
      base.status = "PARTIAL";
      base.notes.push("Water properties must be resolved from IAPWS using the actual thermodynamic state.");
      base.missingProperties.push("resolved_density", "resolved_cp", "resolved_enthalpy", "resolved_vapor_pressure");
      return base;

    case "MAT-SS316L-SANMAC":
      base.status = "PARTIAL";
      base.notes.push("316L catalog data can support interpolation of the published thermal-property tables within their stated range.");
      base.missingProperties.push("geometry_specific_allowable_stress", "weld_joint_efficiency", "fatigue_model");
      return base;

    case "MAT-PATCHOULI-LEAF-POGOSTEMON-CABLIN":
    case "MAT-COCONUT-SHELL-BIOMASS":
    case "MAT-ETHANOL-C2H6O":
    case "MAT-GLYCERIN-C3H8O3":
      base.status = "PARTIAL";
      base.notes.push("Literature evidence exists, but a complete condition-dependent property surface is not yet available.");
      base.missingProperties.push("condition_dependent_thermal_properties", "validated_process_kinetics");
      return base;

    default:
      base.notes.push("Material is not present in the current SMKB physics adapter registry.");
      base.missingProperties.push("material_registration", "evidence_backed_properties");
      return base;
  }
}
