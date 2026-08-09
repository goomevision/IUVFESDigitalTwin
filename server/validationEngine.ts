export type ValidationAcceptanceCriteria = { metric: string; unit: string; maxMeanAbsoluteError: number; maxAbsoluteError: number; minimumComparedPoints: number; measuredUncertainty?: number; };
export type ValidationResult = { metric: string; status: "VALIDATED" | "PARTIALLY_VALIDATED" | "NOT_VALIDATED" | "INSUFFICIENT_DATA"; comparedPoints: number; meanAbsoluteError?: number; maxAbsoluteError?: number; criteria: ValidationAcceptanceCriteria; reasons: string[]; };

export function validateTimeSeriesComparison(criteria: ValidationAcceptanceCriteria, comparedPoints: number, meanAbsoluteError?: number, maxAbsoluteError?: number): ValidationResult {
  const reasons: string[] = [];
  if (comparedPoints < criteria.minimumComparedPoints) reasons.push(`Compared points ${comparedPoints} is below required minimum ${criteria.minimumComparedPoints}.`);
  if (meanAbsoluteError === undefined || maxAbsoluteError === undefined) reasons.push("Error metrics are incomplete.");
  if (reasons.length > 0) return { metric: criteria.metric, status: comparedPoints === 0 ? "INSUFFICIENT_DATA" : "PARTIALLY_VALIDATED", comparedPoints, meanAbsoluteError, maxAbsoluteError, criteria, reasons };

  const meanError = meanAbsoluteError as number;
  const maxError = maxAbsoluteError as number;
  const meanPass = meanError <= criteria.maxMeanAbsoluteError;
  const maxPass = maxError <= criteria.maxAbsoluteError;
  if (meanPass && maxPass) return { metric: criteria.metric, status: "VALIDATED", comparedPoints, meanAbsoluteError: meanError, maxAbsoluteError: maxError, criteria, reasons: ["All configured acceptance criteria passed."] };
  return {
    metric: criteria.metric,
    status: meanPass || maxPass ? "PARTIALLY_VALIDATED" : "NOT_VALIDATED",
    comparedPoints,
    meanAbsoluteError: meanError,
    maxAbsoluteError: maxError,
    criteria,
    reasons: [`Mean error criterion: ${meanPass ? "PASS" : "FAIL"}.`, `Maximum error criterion: ${maxPass ? "PASS" : "FAIL"}.`],
  };
}
