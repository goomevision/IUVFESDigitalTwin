export type TimelineObservation = {
  physicalTimeS: number;
  parameter: string;
  value: number;
  unit: string;
};

export type Reconciliation = {
  parameter: string;
  unit: string;
  experimentValue: number;
  nearestSimulationValue: number;
  physicalTimeS: number;
  absoluteError: number;
};

/** Matches measured observations to the nearest physical-time simulation sample. */
export function reconcileExperimentToSimulation(
  observations: TimelineObservation[],
  simulation: TimelineObservation[],
): Reconciliation[] {
  return observations.map((observation) => {
    const candidates = simulation.filter((sample) => sample.parameter === observation.parameter && sample.unit === observation.unit);
    if (candidates.length === 0) throw new Error(`No simulation series for ${observation.parameter} [${observation.unit}].`);
    const nearest = candidates.reduce((best, current) => Math.abs(current.physicalTimeS - observation.physicalTimeS) < Math.abs(best.physicalTimeS - observation.physicalTimeS) ? current : best);
    return {
      parameter: observation.parameter,
      unit: observation.unit,
      experimentValue: observation.value,
      nearestSimulationValue: nearest.value,
      physicalTimeS: nearest.physicalTimeS,
      absoluteError: Math.abs(observation.value - nearest.value),
    };
  });
}
