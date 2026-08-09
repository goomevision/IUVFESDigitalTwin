import { UncertaintySensitivityResult } from "./uncertaintySensitivityEngine";
import { UncertaintySource } from "./uncertaintyBudget";

export type RiskPriority = "HIGH" | "MEDIUM" | "LOW";

export type SensitivityRiskItem = {
  parameterId: string;
  sensitivity: number;
  uncertaintySourceIds: string[];
  priority: RiskPriority;
  rationale: string;
};

/**
 * Prioritizes investigation using normalized sensitivity and the presence of
 * uncertainty sources mapped to the parameter. This is a screening aid, not
 * a safety assessment or probability-of-failure calculation.
 */
export function buildSensitivityRiskPriorities(
  sensitivity: UncertaintySensitivityResult[],
  sources: UncertaintySource[],
): SensitivityRiskItem[] {
  const mapped = new Map<string, UncertaintySource[]>();
  for (const source of sources) {
    const existing = mapped.get(source.name) ?? [];
    existing.push(source);
    mapped.set(source.name, existing);
  }

  return [...sensitivity]
    .sort((a, b) => b.normalizedSensitivity - a.normalizedSensitivity)
    .map((item) => {
      const related = mapped.get(item.parameterId) ?? [];
      const hasUncertainty = related.length > 0;
      const priority: RiskPriority = item.normalizedSensitivity >= 1 && hasUncertainty
        ? "HIGH"
        : item.normalizedSensitivity >= 0.5 || hasUncertainty
          ? "MEDIUM"
          : "LOW";

      return {
        parameterId: item.parameterId,
        sensitivity: item.normalizedSensitivity,
        uncertaintySourceIds: related.map((source) => source.id),
        priority,
        rationale: hasUncertainty
          ? "High-impact parameter with declared uncertainty source(s); prioritize measurement/model improvement."
          : "Sensitivity detected, but no mapped uncertainty source was declared.",
      };
    });
}
