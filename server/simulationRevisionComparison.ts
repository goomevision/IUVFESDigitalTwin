export type SimulationMetric = { name: string; value: number; unit: string };

export type SimulationRevisionResult = {
  simulationId: string;
  materialRevisionId: string;
  metrics: SimulationMetric[];
};

export type SimulationRevisionDelta = {
  name: string;
  unit: string;
  fromValue: number;
  toValue: number;
  absoluteDelta: number;
  relativeDelta?: number;
};

export function compareSimulationRevisionResults(
  from: SimulationRevisionResult,
  to: SimulationRevisionResult,
): SimulationRevisionDelta[] {
  const deltas: SimulationRevisionDelta[] = [];
  for (const oldMetric of from.metrics) {
    const newMetric = to.metrics.find((metric) => metric.name === oldMetric.name && metric.unit === oldMetric.unit);
    if (!newMetric) continue;
    const absoluteDelta = newMetric.value - oldMetric.value;
    deltas.push({
      name: oldMetric.name,
      unit: oldMetric.unit,
      fromValue: oldMetric.value,
      toValue: newMetric.value,
      absoluteDelta,
      relativeDelta: oldMetric.value === 0 ? undefined : absoluteDelta / oldMetric.value,
    });
  }
  return deltas;
}
