export type MaterialInputField = {
  key: string;
  label: string;
  unit: string;
  required: boolean;
  reason: string;
};

export type OperatorMaterialSubmission = {
  materialId: string;
  name: string;
  basis: "PURE_COMPONENT" | "MIXTURE" | "RAW_BOTANICAL";
  values: Record<string, number>;
  units: Record<string, string>;
  methods: Record<string, string>;
  sourceRefs: Record<string, string>;
  operatorId: string;
  submittedAt: string;
};

export type MaterialIntakeStatus = "KNOWN" | "PARTIAL" | "READY_FOR_REVIEW" | "BLOCKED";

export type MaterialIntakeResult = {
  status: MaterialIntakeStatus;
  missing: MaterialInputField[];
  warnings: string[];
  submission?: OperatorMaterialSubmission;
};

const CORE_FIELDS: MaterialInputField[] = [
  { key: "densityKgPerM3", label: "Density", unit: "kg/m³", required: true, reason: "Required for mass-volume and process-state calculations." },
  { key: "heatCapacityJPerKgK", label: "Heat capacity", unit: "J/(kg·K)", required: true, reason: "Required for transient energy balance." },
  { key: "latentHeatJPerKg", label: "Latent heat", unit: "J/kg", required: false, reason: "Required when phase change is modeled." },
  { key: "vaporPressurePa", label: "Vapor pressure relation/data", unit: "Pa", required: false, reason: "Required for evaporation/VLE calculations." },
];

export function requiredMaterialFields(basis: OperatorMaterialSubmission["basis"], phaseChangeEnabled = true): MaterialInputField[] {
  return CORE_FIELDS.filter((field) => field.required || (phaseChangeEnabled && ["latentHeatJPerKg", "vaporPressurePa"].includes(field.key)))
    .map((field) => basis === "RAW_BOTANICAL" && field.key === "vaporPressurePa"
      ? { ...field, reason: "Raw botanical material must provide measured/composition-based vapor-pressure evidence before multicomponent evaporation is enabled." }
      : field);
}

export function intakeUnknownMaterial(
  submission: OperatorMaterialSubmission,
  knownMaterialIds: string[],
  phaseChangeEnabled = true,
): MaterialIntakeResult {
  if (!submission.materialId || !submission.name || !submission.operatorId || !submission.submittedAt) {
    return { status: "BLOCKED", missing: [], warnings: ["Material identity and operator submission metadata are required."] };
  }

  if (knownMaterialIds.includes(submission.materialId)) {
    return { status: "KNOWN", missing: [], warnings: ["Material ID already exists; do not silently overwrite the evidence record."] };
  }

  const missing = requiredMaterialFields(submission.basis, phaseChangeEnabled).filter((field) => {
    const value = submission.values[field.key];
    return value === undefined || !Number.isFinite(value) || !submission.units[field.key] || !submission.methods[field.key] || !submission.sourceRefs[field.key];
  });

  const warnings: string[] = [
    "Operator-supplied values are provisional until reviewed and linked to evidence.",
    "AI must not infer missing material properties and present them as measured facts.",
  ];

  if (submission.basis === "MIXTURE" || submission.basis === "RAW_BOTANICAL") {
    warnings.push("Composition or batch-specific evidence is required before treating the material as a pure component.");
  }

  return {
    status: missing.length === 0 ? "READY_FOR_REVIEW" : "PARTIAL",
    missing,
    warnings,
    submission,
  };
}
