/**
 * Deterministic comparison of simulation time-series against laboratory observations.
 * Residual convention: simulation - experimental.
 */

export type ComparisonVerdict = "PASS" | "FAIL" | "INCONCLUSIVE";

export interface ExperimentalObservation {
  parameter: string;
  timeSeconds: number;
  value: number;
  qualityFlag?: "RAW" | "VALIDATED" | "REJECTED" | "CORRECTED";
}

export interface SimulationObservation {
  timeSeconds: number;
  values: Record<string, number>;
}

export interface ParameterTolerance {
  maxBias?: number;
  maxMae?: number;
  maxRmse?: number;
  maxAbsoluteError?: number;
}

export interface ParameterComparison {
  parameter: string;
  sampleCount: number;
  excludedCount: number;
  bias: number;
  mae: number;
  rmse: number;
  maxAbsoluteError: number;
  meanExperimental: number;
  meanSimulation: number;
  residuals: Array<{ timeSeconds: number; experimental: number; simulation: number; residual: number }>;
  verdict: ComparisonVerdict;
}

export interface ComparisonReport {
  verdict: ComparisonVerdict;
  parameters: ParameterComparison[];
  totalExperimentalObservations: number;
  matchedObservations: number;
  unmatchedObservations: number;
  medianAlignmentErrorSeconds: number;
  notes: string[];
}

function finite(value: number): boolean {
  return Number.isFinite(value);
}

function mean(values: number[]): number {
  return values.length === 0 ? NaN : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function interpolate(series: SimulationObservation[], parameter: string, timeSeconds: number) {
  const points = series
    .map(point => ({ time: point.timeSeconds, value: point.values[parameter] }))
    .filter(point => finite(point.time) && finite(point.value))
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

function verdictFor(metrics: { bias: number; mae: number; rmse: number; maxAbsoluteError: number }, tolerance?: ParameterTolerance): ComparisonVerdict {
  if (!tolerance) return "INCONCLUSIVE";
  const checks = [
    tolerance.maxBias === undefined || Math.abs(metrics.bias) <= tolerance.maxBias,
    tolerance.maxMae === undefined || metrics.mae <= tolerance.maxMae,
    tolerance.maxRmse === undefined || metrics.rmse <= tolerance.maxRmse,
    tolerance.maxAbsoluteError === undefined || metrics.maxAbsoluteError <= tolerance.maxAbsoluteError,
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
      const residual = simulationValue - observation.value;
      residuals.push({ timeSeconds: observation.timeSeconds, experimental: observation.value, simulation: simulationValue, residual });
    }

    const residualValues = residuals.map(item => item.residual);
    const absResiduals = residualValues.map(Math.abs);
    const bias = mean(residualValues);
    const mae = mean(absResiduals);
    const rmse = residualValues.length === 0 ? NaN : Math.sqrt(mean(residualValues.map(value => value * value)));
    const maxAbsoluteError = residualValues.length === 0 ? NaN : Math.max(...absResiduals);
    const report: ParameterComparison = {
      parameter,
      sampleCount: residuals.length,
      excludedCount,
      bias,
      mae,
      rmse,
      maxAbsoluteError,
      meanExperimental: mean(residuals.map(item => item.experimental)),
      meanSimulation: mean(residuals.map(item => item.simulation)),
      residuals,
      verdict: residuals.length === 0 ? "INCONCLUSIVE" : verdictFor({ bias, mae, rmse, maxAbsoluteError }, input.tolerances?.[parameter]),
    };
    reports.push(report);
  }

  const hasFail = reports.some(report => report.verdict === "FAIL");
  const allPass = reports.length > 0 && reports.every(report => report.verdict === "PASS");
  const notes: string[] = [];
  if (accepted.length !== input.experimental.length) notes.push("Rejected or non-finite experimental observations were excluded from comparison.");
  if (unmatched > 0) notes.push("Some experimental timestamps fell outside the simulation time domain and were not compared.");
  if (reports.some(report => report.verdict === "INCONCLUSIVE")) notes.push("At least one parameter has no acceptance tolerance; metrics are reported but no scientific pass/fail verdict is assigned.");
  notes.push("Residuals are defined as simulation minus experimental measurement.");
  notes.push("This report evaluates numerical agreement only; it does not certify physical model validity or measurement accuracy.");

  return {
    verdict: hasFail ? "FAIL" : allPass ? "PASS" : "INCONCLUSIVE",
    parameters: reports,
    totalExperimentalObservations: input.experimental.length,
    matchedObservations: reports.reduce((sum, report) => sum + report.sampleCount, 0),
    unmatchedObservations: unmatched,
    medianAlignmentErrorSeconds: median(alignmentErrors),
    notes,
  };
}
