export type TimeSeriesPoint = { timeS: number; value: number };

export type TimeSeriesComparison = {
  metric: string;
  unit: string;
  measured: TimeSeriesPoint[];
  simulated: TimeSeriesPoint[];
  absoluteError: TimeSeriesPoint[];
  summary: {
    maxAbsoluteError?: number;
    meanAbsoluteError?: number;
    comparedPoints: number;
  };
};

function validate(name: string, series: TimeSeriesPoint[]): void {
  for (let i = 0; i < series.length; i += 1) {
    if (!Number.isFinite(series[i].timeS) || !Number.isFinite(series[i].value)) {
      throw new Error(`${name} contains non-finite values.`);
    }
    if (i > 0 && series[i].timeS <= series[i - 1].timeS) {
      throw new Error(`${name} timestamps must be strictly increasing.`);
    }
  }
}

/**
 * Compares points only at identical timestamps. It does not interpolate or
 * fabricate missing observations; future versions may add an explicit,
 * documented interpolation policy.
 */
export function compareTimeSeries(
  metric: string,
  unit: string,
  measured: TimeSeriesPoint[],
  simulated: TimeSeriesPoint[],
): TimeSeriesComparison {
  validate("measured", measured);
  validate("simulated", simulated);

  const simulatedByTime = new Map(simulated.map((point) => [point.timeS, point.value]));
  const absoluteError = measured
    .filter((point) => simulatedByTime.has(point.timeS))
    .map((point) => ({ timeS: point.timeS, value: Math.abs(point.value - simulatedByTime.get(point.timeS)!) }));

  const errors = absoluteError.map((point) => point.value);
  return {
    metric,
    unit,
    measured,
    simulated,
    absoluteError,
    summary: {
      maxAbsoluteError: errors.length ? Math.max(...errors) : undefined,
      meanAbsoluteError: errors.length ? errors.reduce((a, b) => a + b, 0) / errors.length : undefined,
      comparedPoints: errors.length,
    },
  };
}
