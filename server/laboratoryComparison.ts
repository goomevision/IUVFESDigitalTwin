export type ComparisonMetricName = 'MAE' | 'RMSE' | 'BIAS' | 'MAX_ABSOLUTE_ERROR' | 'RELATIVE_ERROR_PERCENT';

export interface ValidationSeriesPoint {
  timestampSeconds: number;
  value: number;
}

export interface ValidationSeries {
  name: string;
  unit: string;
  simulation: ValidationSeriesPoint[];
  laboratory: ValidationSeriesPoint[];
}

export interface ValidationAcceptanceCriterion {
  metric: ComparisonMetricName;
  maxValue: number;
  unit: string;
}

export interface ValidationMetricResult {
  metric: ComparisonMetricName;
  value: number;
  unit: string;
  passed: boolean;
}

export interface ValidationSeriesResult {
  name: string;
  unit: string;
  sampleCount: number;
  metrics: ValidationMetricResult[];
}

export interface LaboratoryComparisonResult {
  status: 'PASS' | 'PASS_WITH_LIMITATIONS' | 'FAIL' | 'INCONCLUSIVE';
  series: ValidationSeriesResult[];
  reasons: string[];
}

function interpolate(series: ValidationSeriesPoint[], t: number): number | null {
  if (series.length === 0) return null;
  if (t < series[0].timestampSeconds || t > series[series.length - 1].timestampSeconds) return null;
  for (let i = 0; i < series.length; i += 1) {
    const current = series[i];
    if (current.timestampSeconds === t) return current.value;
    const next = series[i + 1];
    if (next && current.timestampSeconds < t && t < next.timestampSeconds) {
      const ratio = (t - current.timestampSeconds) / (next.timestampSeconds - current.timestampSeconds);
      return current.value + ratio * (next.value - current.value);
    }
  }
  return null;
}

export function compareValidationSeries(
  input: ValidationSeries,
  criteria: ValidationAcceptanceCriterion[],
): ValidationSeriesResult {
  const pairs = input.laboratory.flatMap((lab) => {
    const simulated = interpolate(input.simulation, lab.timestampSeconds);
    return simulated === null ? [] : [{ observed: lab.value, predicted: simulated }];
  });

  const count = pairs.length;
  if (count === 0) {
    return { name: input.name, unit: input.unit, sampleCount: 0, metrics: [] };
  }

  const errors = pairs.map(({ observed, predicted }) => predicted - observed);
  const absoluteErrors = errors.map(Math.abs);
  const squaredErrors = errors.map((error) => error * error);
  const mae = absoluteErrors.reduce((sum, value) => sum + value, 0) / count;
  const rmse = Math.sqrt(squaredErrors.reduce((sum, value) => sum + value, 0) / count);
  const bias = errors.reduce((sum, value) => sum + value, 0) / count;
  const maxAbsoluteError = Math.max(...absoluteErrors);
  const meanObserved = pairs.reduce((sum, pair) => sum + Math.abs(pair.observed), 0) / count;
  const relativeErrorPercent = meanObserved === 0 ? (mae === 0 ? 0 : Infinity) : (mae / meanObserved) * 100;

  const values: Record<ComparisonMetricName, number> = {
    MAE: mae,
    RMSE: rmse,
    BIAS: Math.abs(bias),
    MAX_ABSOLUTE_ERROR: maxAbsoluteError,
    RELATIVE_ERROR_PERCENT: relativeErrorPercent,
  };

  const metrics = criteria.map((criterion) => ({
    metric: criterion.metric,
    value: values[criterion.metric],
    unit: criterion.unit,
    passed: Number.isFinite(values[criterion.metric]) && values[criterion.metric] <= criterion.maxValue,
  }));

  return { name: input.name, unit: input.unit, sampleCount: count, metrics };
}

export function compareLaboratoryRun(
  series: ValidationSeries[],
  criteriaBySeries: Record<string, ValidationAcceptanceCriterion[]>,
): LaboratoryComparisonResult {
  if (series.length === 0) {
    return { status: 'INCONCLUSIVE', series: [], reasons: ['No simulation/laboratory series were supplied.'] };
  }

  const results = series.map((item) => compareValidationSeries(item, criteriaBySeries[item.name] ?? []));
  const reasons: string[] = [];
  for (const result of results) {
    if (result.sampleCount === 0) reasons.push(`No time-overlap samples for ${result.name}.`);
    if (result.metrics.length === 0) reasons.push(`No acceptance criteria defined for ${result.name}.`);
  }

  if (reasons.length > 0) return { status: 'INCONCLUSIVE', series: results, reasons };
  const allPassed = results.every((result) => result.metrics.every((metric) => metric.passed));
  return {
    status: allPassed ? 'PASS' : 'FAIL',
    series: results,
    reasons: allPassed ? [] : ['One or more declared acceptance criteria failed.'],
  };
}
