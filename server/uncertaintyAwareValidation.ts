export type UncertaintyAwareCriteria = { metric: string; unit: string; maxMeanAbsoluteError: number; maxAbsoluteError: number; minimumComparedPoints: number; measuredUncertainty?: number; modelUncertainty?: number; };
export type UncertaintyAwareValidationResult = { metric: string; status: "VALIDATED" | "PARTIALLY_VALIDATED" | "NOT_VALIDATED" | "INSUFFICIENT_DATA"; combinedUncertainty?: number; meanAbsoluteError?: number; maxAbsoluteError?: number; comparedPoints: number; criteria: UncertaintyAwareCriteria; reasons: string[]; };

export function combineIndependentUncertainty(...uncertainties: Array<number | undefined>): number | undefined {
  const values = uncertainties.filter((value): value is number => value !== undefined);
  if (values.length === 0) return undefined;
  if (values.some((value) => !Number.isFinite(value) || value < 0)) throw new Error("Uncertainty values must be finite and non-negative.");
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
}

export function validateWithUncertainty(criteria: UncertaintyAwareCriteria, comparedPoints: number, meanAbsoluteError?: number, maxAbsoluteError?: number): UncertaintyAwareValidationResult {
  const reasons: string[] = [];
  const combinedUncertainty = combineIndependentUncertainty(criteria.measuredUncertainty, criteria.modelUncertainty);
  if (comparedPoints < criteria.minimumComparedPoints) reasons.push(`Compared points ${comparedPoints} is below required minimum ${criteria.minimumComparedPoints}.`);
  if (meanAbsoluteError === undefined || maxAbsoluteError === undefined) reasons.push("Error metrics are incomplete.");
  if (reasons.length > 0) return { metric: criteria.metric, status: comparedPoints === 0 ? "INSUFFICIENT_DATA" : "PARTIALLY_VALIDATED", combinedUncertainty, meanAbsoluteError, maxAbsoluteError, comparedPoints, criteria, reasons };

  const meanError = meanAbsoluteError as number;
  const maxError = maxAbsoluteError as number;
  const meanLimit = criteria.maxMeanAbsoluteError + (combinedUncertainty ?? 0);
  const maxLimit = criteria.maxAbsoluteError + (combinedUncertainty ?? 0);
  const meanPass = meanError <= meanLimit;
  const maxPass = maxError <= maxLimit;
  return {
    metric: criteria.metric,
    status: meanPass && maxPass ? "VALIDATED" : meanPass || maxPass ? "PARTIALLY_VALIDATED" : "NOT_VALIDATED",
    combinedUncertainty,
    meanAbsoluteError: meanError,
    maxAbsoluteError: maxError,
    comparedPoints,
    criteria,
    reasons: [
      `Mean error criterion: ${meanPass ? "PASS" : "FAIL"}.`,
      `Maximum error criterion: ${maxPass ? "PASS" : "FAIL"}.`,
      `Combined uncertainty allowance: ${combinedUncertainty ?? 0} ${criteria.unit}.`,
    ],
  };
}
