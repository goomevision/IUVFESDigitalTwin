export type ValidationAcceptanceCriteria = {
  metric: string;
  unit: string;
  maxMeanAbsoluteError: number;
  maxAbsoluteError: number;
  minimumComparedPoints: number;
  measuredUncertainty?: number;
};

export type ValidationResult = {
  metric: string;
  status: "VALIDATED" | "PARTIALLY_VALIDATED" | "NOT_VALIDATED" | "INSUFFICIENT_DATA";
  comparedPoints: number;
  meanAbsoluteError?: number;
  maxAbsoluteError?: number;
  criteria: ValidationAcceptanceCriteria;
  reasons: string[];
};

export function validateTimeSeriesComparison(
  criteria: ValidationAcceptanceCriteria,
  comparedPoints: number,
  meanAbsoluteError?: number,
  maxAbsoluteError?: number,
): ValidationResult {
  const reasons: string[] = [];
  if (comparedPoints < criteria.minimumComparedPoints) {
    reasons.push(`Compared points ${comparedPoints} is below required minimum ${criteria.minimumComparedPoints}.`);
  }
  if (meanAbsoluteError === undefined || maxAbsoluteError === undefined) {
    reasons.push("Error metrics are incomplete.");
  }

  if (reasons.length > 0) {
    return {
      metric: criteria.metric,
      status: comparedPoints === 0 ? "INSUFFICIENT_DATA" : "PARTIALLY_VALIDATED",
      comparedPoints,
      meanAbsoluteError,
      maxAbsoluteError,
      criteria,
      reasons,
    };
  }

  const meanPass = meanAbsoluteError <= criteria.maxMeanAbsoluteError;
  const maxPass = maxAbsoluteError <= criteria.maxAbsoluteError;
  if (meanPass && maxPass) {
    return {
      metric: criteria.metric,
      status: "VALIDATED",
      comparedPoints,
      meanAbsoluteError,
      maxAbsoluteError,
      criteria,
      reasons: ["All configured acceptance criteria passed."],
    };
  }

  if (meanPass || maxPass) {
    return {
      metric: criteria.metric,
      status: "PARTIALLY_VALIDATED",
      comparedPoints,
      meanAbsoluteError,
      maxAbsoluteError,
      criteria,
      reasons: [
        `Mean error criterion: ${meanPass ? "PASS" : "FAIL"}.`,
        `Maximum error criterion: ${maxPass ? "PASS" : "FAIL"}.`,
      ],
    };
  }

  return {
    metric: criteria.metric,
    status: "NOT_VALIDATED",
    comparedPoints,
    meanAbsoluteError,
    maxAbsoluteError,
    criteria,
    reasons: [
      `Mean error criterion: ${meanPass ? "PASS" : "FAIL"}.`,
      `Maximum error criterion: ${maxPass ? "PASS" : "FAIL"}.`,
    ],
  };
}
