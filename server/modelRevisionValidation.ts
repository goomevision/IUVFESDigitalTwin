export type RevisionMetric = {
  name: string;
  value: number;
  unit: string;
};

export type RevisionValidationInput = {
  metric: RevisionMetric;
  measuredValue: number;
  tolerance: number;
};

export type RevisionValidationResult = {
  metric: string;
  unit: string;
  measuredValue: number;
  modelValue: number;
  absoluteError: number;
  tolerance: number;
  pass: boolean;
};

export type ModelRevisionValidationReport = {
  materialId: string;
  revisionId: string;
  results: RevisionValidationResult[];
  passedMetrics: number;
  failedMetrics: number;
  overall: "VALIDATED" | "NOT_VALIDATED" | "INSUFFICIENT_DATA";
};

/**
 * Compares a model revision with measured evidence using explicitly supplied
 * tolerances. It does not infer tolerances, uncertainty, causality, or safety.
 */
export function validateModelRevision(
  materialId: string,
  revisionId: string,
  inputs: RevisionValidationInput[],
): ModelRevisionValidationReport {
  if (inputs.length === 0) {
    return { materialId, revisionId, results: [], passedMetrics: 0, failedMetrics: 0, overall: "INSUFFICIENT_DATA" };
  }

  const results = inputs.map(({ metric, measuredValue, tolerance }) => {
    if (!Number.isFinite(metric.value) || !Number.isFinite(measuredValue) || !Number.isFinite(tolerance) || tolerance < 0) {
      throw new Error(`Invalid validation input for metric ${metric.name}.`);
    }
    const absoluteError = Math.abs(metric.value - measuredValue);
    return {
      metric: metric.name,
      unit: metric.unit,
      measuredValue,
      modelValue: metric.value,
      absoluteError,
      tolerance,
      pass: absoluteError <= tolerance,
    };
  });

  const passedMetrics = results.filter((result) => result.pass).length;
  const failedMetrics = results.length - passedMetrics;
  return {
    materialId,
    revisionId,
    results,
    passedMetrics,
    failedMetrics,
    overall: failedMetrics === 0 ? "VALIDATED" : "NOT_VALIDATED",
  };
}
