export type TimeSeriesPoint = { timeS: number; value: number };

export type SimulationRunResult = {
  simulationRunId: string;
  modelVersion: string;
  parameterSetId: string;
  datasetIds: string[];
  pressureKPa: TimeSeriesPoint[];
  temperatureK: TimeSeriesPoint[];
  massKg: TimeSeriesPoint[];
  quality?: TimeSeriesPoint[];
  yield?: number;
  energyInputJ?: number;
  energyOutputJ?: number;
  warnings?: string[];
};

export type ExtractedSimulationEvidence = {
  simulationRunId: string;
  modelVersion: string;
  parameterSetId: string;
  datasetIds: string[];
  pressure: { minKPa: number; maxKPa: number; maxAbsRateKPaPerS: number };
  temperature: { minK: number; maxK: number; maxAbsRateKPerS: number };
  mass: { initialKg: number; finalKg: number; changeKg: number };
  phase: { minQuality?: number; maxQuality?: number };
  yield?: number;
  energy: { inputJ?: number; outputJ?: number; balanceJ?: number };
  warnings: string[];
};

function requireSeries(name: string, series: TimeSeriesPoint[]): TimeSeriesPoint[] {
  if (series.length === 0) throw new Error(`${name} time series is required.`);
  for (const point of series) {
    if (!Number.isFinite(point.timeS) || !Number.isFinite(point.value)) {
      throw new Error(`${name} contains non-finite values.`);
    }
  }
  return series;
}

function maxAbsRate(series: TimeSeriesPoint[]): number {
  let result = 0;
  for (let i = 1; i < series.length; i += 1) {
    const dt = series[i].timeS - series[i - 1].timeS;
    if (dt <= 0) throw new Error("Time series must have strictly increasing timestamps.");
    result = Math.max(result, Math.abs((series[i].value - series[i - 1].value) / dt));
  }
  return result;
}

export function extractSimulationEvidence(run: SimulationRunResult): ExtractedSimulationEvidence {
  const pressure = requireSeries("pressure", run.pressureKPa);
  const temperature = requireSeries("temperature", run.temperatureK);
  const mass = requireSeries("mass", run.massKg);
  const quality = run.quality ? requireSeries("quality", run.quality) : undefined;

  return {
    simulationRunId: run.simulationRunId,
    modelVersion: run.modelVersion,
    parameterSetId: run.parameterSetId,
    datasetIds: [...run.datasetIds],
    pressure: {
      minKPa: Math.min(...pressure.map((p) => p.value)),
      maxKPa: Math.max(...pressure.map((p) => p.value)),
      maxAbsRateKPaPerS: maxAbsRate(pressure),
    },
    temperature: {
      minK: Math.min(...temperature.map((p) => p.value)),
      maxK: Math.max(...temperature.map((p) => p.value)),
      maxAbsRateKPerS: maxAbsRate(temperature),
    },
    mass: {
      initialKg: mass[0].value,
      finalKg: mass[mass.length - 1].value,
      changeKg: mass[mass.length - 1].value - mass[0].value,
    },
    phase: quality
      ? { minQuality: Math.min(...quality.map((p) => p.value)), maxQuality: Math.max(...quality.map((p) => p.value)) }
      : {},
    yield: run.yield,
    energy: {
      inputJ: run.energyInputJ,
      outputJ: run.energyOutputJ,
      balanceJ: run.energyInputJ !== undefined && run.energyOutputJ !== undefined
        ? run.energyInputJ - run.energyOutputJ
        : undefined,
    },
    warnings: [...(run.warnings ?? [])],
  };
}
