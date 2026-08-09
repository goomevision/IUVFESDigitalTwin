/**
 * Deterministic uncertainty and replicate-analysis helpers.
 *
 * This layer deliberately does not claim a metrological uncertainty budget unless
 * the caller supplies one. It separates repeatability statistics from measurement
 * uncertainty and never turns a confidence interval into proof of model validity.
 */

export interface ReplicateSummary {
  count: number;
  mean: number;
  standardDeviation: number;
  standardError: number;
  coefficientOfVariation: number;
  min: number;
  max: number;
}

export interface UncertaintyInput {
  values: number[];
  instrumentStandardUncertainty?: number;
  coverageFactor?: number;
  confidenceMultiplier?: number;
}

export interface UncertaintyResult extends ReplicateSummary {
  repeatabilityUncertainty: number;
  instrumentStandardUncertainty: number;
  combinedStandardUncertainty: number;
  expandedUncertainty: number;
  confidenceMultiplier: number;
  intervalLow: number;
  intervalHigh: number;
  interpretation: "ESTIMATED" | "INSUFFICIENT_DATA";
}

function finiteValues(values: number[]): number[] {
  return values.filter(Number.isFinite);
}

export function summarizeReplicates(values: number[]): ReplicateSummary {
  const data = finiteValues(values);
  if (data.length === 0) {
    return { count: 0, mean: NaN, standardDeviation: NaN, standardError: NaN, coefficientOfVariation: NaN, min: NaN, max: NaN };
  }
  const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
  const variance = data.length > 1
    ? data.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (data.length - 1)
    : NaN;
  const standardDeviation = Math.sqrt(variance);
  const standardError = data.length > 1 ? standardDeviation / Math.sqrt(data.length) : NaN;
  const coefficientOfVariation = mean === 0 ? NaN : Math.abs(standardDeviation / mean);
  return { count: data.length, mean, standardDeviation, standardError, coefficientOfVariation, min: Math.min(...data), max: Math.max(...data) };
}

export function estimateUncertainty(input: UncertaintyInput): UncertaintyResult {
  const summary = summarizeReplicates(input.values);
  const instrumentStandardUncertainty = Math.max(0, input.instrumentStandardUncertainty ?? 0);
  const confidenceMultiplier = input.confidenceMultiplier ?? input.coverageFactor ?? 2;
  if (summary.count < 2 || !Number.isFinite(summary.standardError)) {
    return {
      ...summary,
      repeatabilityUncertainty: NaN,
      instrumentStandardUncertainty,
      combinedStandardUncertainty: NaN,
      expandedUncertainty: NaN,
      confidenceMultiplier,
      intervalLow: NaN,
      intervalHigh: NaN,
      interpretation: "INSUFFICIENT_DATA",
    };
  }
  const combinedStandardUncertainty = Math.sqrt(summary.standardError ** 2 + instrumentStandardUncertainty ** 2);
  const expandedUncertainty = confidenceMultiplier * combinedStandardUncertainty;
  return {
    ...summary,
    repeatabilityUncertainty: summary.standardError,
    instrumentStandardUncertainty,
    combinedStandardUncertainty,
    expandedUncertainty,
    confidenceMultiplier,
    intervalLow: summary.mean - expandedUncertainty,
    intervalHigh: summary.mean + expandedUncertainty,
    interpretation: "ESTIMATED",
  };
}

export interface ValidationWithUncertaintyInput {
  experimentalValues: number[];
  simulationValue: number;
  instrumentStandardUncertainty?: number;
  confidenceMultiplier?: number;
  tolerance?: number;
}

export interface ValidationWithUncertaintyResult {
  experimental: UncertaintyResult;
  simulationValue: number;
  residual: number;
  residualWithinExpandedUncertainty: boolean | null;
  tolerancePass: boolean | null;
  verdict: "PASS" | "FAIL" | "INCONCLUSIVE";
  notes: string[];
}

export function validateAgainstReplicates(input: ValidationWithUncertaintyInput): ValidationWithUncertaintyResult {
  const experimental = estimateUncertainty({ values: input.experimentalValues, instrumentStandardUncertainty: input.instrumentStandardUncertainty, confidenceMultiplier: input.confidenceMultiplier });
  const residual = input.simulationValue - experimental.mean;
  const residualWithinExpandedUncertainty = experimental.interpretation === "ESTIMATED"
    ? Math.abs(residual) <= experimental.expandedUncertainty
    : null;
  const tolerancePass = input.tolerance === undefined ? null : Math.abs(residual) <= input.tolerance;
  const notes: string[] = ["Residual is defined as simulation minus experimental mean."];
  if (experimental.interpretation === "INSUFFICIENT_DATA") notes.push("At least two finite experimental replicates are required before uncertainty-based validation can be interpreted.");
  if (input.tolerance === undefined) notes.push("No acceptance tolerance was supplied; uncertainty agreement alone does not establish model validity.");
  const verdict = experimental.interpretation === "INSUFFICIENT_DATA"
    ? "INCONCLUSIVE"
    : tolerancePass === false
      ? "FAIL"
      : tolerancePass === true
        ? "PASS"
        : "INCONCLUSIVE";
  return { experimental, simulationValue: input.simulationValue, residual, residualWithinExpandedUncertainty, tolerancePass, verdict, notes };
}
