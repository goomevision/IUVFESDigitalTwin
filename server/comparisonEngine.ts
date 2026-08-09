import type { ComparisonReport, ComparisonVerdict, ExperimentalObservation, ParameterComparison, ParameterTolerance, SimulationObservation } from "./types";

function finite(value: number): boolean {
  return Number.isFinite(value);
}

function interpolate(series: SimulationObservation[], parameter: string, timeSeconds: number): number | null {
  const points = series
    .filter(point => point.parameter === parameter && finite(point.timeSeconds) && finite(point.value))
    .map(point => ({ time: point.timeSeconds, value: point.value }))
    .sort((a, b) => a.time - b.time);

  if (points.length === 0 || timeSeconds < points[0].time || timeSeconds > points[points.length - 1].time) return null;
  if (points.length === 1) return points[0].value;

  let high = points.findIndex(point => point.time >= timeSeconds);
  if (high < 0) high = points.length - 1;
  if (high === 0) return points[0].value;
  const low = points[high - 1];
  const upper = points[high];
  if (upper.time === low.time) return upper.value;
  const ratio = (timeSeconds - low.time) / (upper.time - low.time);
  return low.value + (upper.value - low.value) * ratio;
}

function nearestAlignmentError(series: SimulationObservation[], timeSeconds: number): number | null {
  const times = series.map(point => point.timeSeconds).filter(finite);
  if (times.length === 0) return null;
  return Math.min(...times.map(time => Math.abs(time - timeSeconds)));
}

function hasExplicitTolerance(tolerance?: ParameterTolerance): boolean {
  return tolerance !== undefined && [tolerance.maxBias, tolerance.maxMae, tolerance.maxRmse, tolerance.maxAbsoluteError]
    .some(value => value !== undefined);
}

function verdictFor(metrics: { bias: number; mae: number; rmse: number; maxAbsoluteError: number }, tolerance?: ParameterTolerance): ComparisonVerdict {
  if (!hasExplicitTolerance(tolerance)) return "INCONCLUSIVE";

  // Capture the narrowed object in a local constant so TypeScript can retain the
  // invariant established by hasExplicitTolerance() across each check.
  const criteria = tolerance as ParameterTolerance;
  const checks = [
    criteria.maxBias === undefined || Math.abs(metrics.bias) <= criteria.maxBias,
    criteria.maxMae === undefined || metrics.mae <= criteria.maxMae,
    criteria.maxRmse === undefined || metrics.rmse <= criteria.maxRmse,
    criteria.maxAbsoluteError === undefined || metrics.maxAbsoluteError <= criteria.maxAbsoluteError,
  ];
  return checks.every(Boolean) ? "PASS" : "FAIL";
}

export function compareSimulationToExperiment(input: {
  experimental: ExperimentalObservation[];
  simulation: SimulationObservation[];
  tolerances?: Record<string, ParameterTolerance>;
}): ComparisonReport {
  const accepted = input.experimental.filter(observation => observation.qualityFlag !== "REJECTED" && finite(observation.timeSeconds) && finite(observation.value));
  const parameters = [...new Set(accepted.map(observation => observation.parameter))].sort();
  const reports: ParameterComparison[] = [];
  const alignmentErrors: number[] = [];
  let unmatched = input.experimental.length - accepted.length;

  for (const parameter of parameters) {
    const observations = accepted.filter(observation => observation.parameter === parameter);
    const residuals: ParameterComparison["residuals"] = [];
    let excludedCount = 0;

    for (const observation of observations) {
      const simulationValue = interpolate(input.simulation, parameter, observation.timeSeconds);
      const alignmentError = nearestAlignmentError(input.simulation, observation.timeSeconds);
      if (alignmentError !== null) alignmentErrors.push(alignmentError);
      if (simulationValue === null) {
        excludedCount += 1;
        unmatched += 1;
        continue;
      }
      residuals.push({
        timeSeconds: observation.timeSeconds,
        experimentalValue: observation.value,
        simulationValue,
        residual: simulationValue - observation.value,
        alignmentErrorSeconds: alignmentError ?? 0,
      });
    }

    if (residuals.length === 0) {
      reports.push({ parameter, sampleCount: 0, excludedCount, bias: NaN, mae: NaN, rmse: NaN, maxAbsoluteError: NaN, verdict: "INCONCLUSIVE", residuals });
      continue;
    }

    const errors = residuals.map(item => item.residual);
    const bias = errors.reduce((sum, value) => sum + value, 0) / errors.length;
    const mae = errors.reduce((sum, value) => sum + Math.abs(value), 0) / errors.length;
    const rmse = Math.sqrt(errors.reduce((sum, value) => sum + value ** 2, 0) / errors.length);
    const maxAbsoluteError = Math.max(...errors.map(value => Math.abs(value)));

    reports.push({
      parameter,
      sampleCount: residuals.length,
      excludedCount,
      bias,
      mae,
      rmse,
      maxAbsoluteError,
      verdict: verdictFor({ bias, mae, rmse, maxAbsoluteError }, input.tolerances?.[parameter]),
      residuals,
    });
  }

  const matchedCount = reports.reduce((sum, report) => sum + report.sampleCount, 0);
  const medianAlignmentErrorSeconds = alignmentErrors.length === 0 ? null : [...alignmentErrors].sort((a, b) => a - b)[Math.floor(alignmentErrors.length / 2)];
  const verdict: ComparisonVerdict = reports.length === 0
    ? "INCONCLUSIVE"
    : reports.every(report => report.verdict === "PASS")
      ? "PASS"
      : reports.some(report => report.verdict === "FAIL")
        ? "FAIL"
        : "INCONCLUSIVE";

  return {
    parameters: reports,
    matchedCount,
    unmatchedCount: unmatched,
    medianAlignmentErrorSeconds,
    verdict,
  };
}
