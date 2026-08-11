/**
 * In-memory evidence boundary used by the scientific API until persistence is wired.
 * This deliberately separates measured/modelled/derived records.
 */
import type { LabMeasurement, MeasurementComparison, SimulationMeasurement } from "./scientificEvidenceEngine";

export interface ScientificEvidenceStore {
  laboratory: readonly LabMeasurement[];
  simulation: readonly SimulationMeasurement[];
  comparisons: readonly MeasurementComparison[];
}

export class ImmutableScientificEvidenceStore {
  private readonly lab: LabMeasurement[] = [];
  private readonly simulation: SimulationMeasurement[] = [];
  private readonly derived: MeasurementComparison[] = [];

  addLaboratory(measurement: LabMeasurement): void {
    if (measurement.origin !== "LABORATORY") throw new Error("Laboratory path accepts only LABORATORY origin");
    this.lab.push(Object.freeze({ ...measurement }));
  }

  addSimulation(measurement: SimulationMeasurement): void {
    if (measurement.origin !== "SIMULATION") throw new Error("Simulation path accepts only SIMULATION origin");
    this.simulation.push(Object.freeze({ ...measurement }));
  }

  addComparison(comparison: MeasurementComparison): void {
    if (comparison.origin !== "DERIVED") throw new Error("Comparison path accepts only DERIVED origin");
    this.derived.push(Object.freeze({ ...comparison }));
  }

  snapshot(): ScientificEvidenceStore {
    return {
      laboratory: this.lab.map(v => ({ ...v })),
      simulation: this.simulation.map(v => ({ ...v })),
      comparisons: this.derived.map(v => ({ ...v })),
    };
  }
}
