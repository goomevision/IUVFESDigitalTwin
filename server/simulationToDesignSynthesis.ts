export type SimulationDesignEvidence = {
  simulationRunId: string;
  validationReportId: string;
  hardwareModelVersion: string;
  datasetIds: string[];
  materialIds: string[];
  peakAbsolutePressureMPa: number;
  minimumAbsolutePressureKPa: number;
  peakTemperatureC: number;
  minimumTemperatureC: number;
  peakHeatingPowerW: number;
  peakCoolingPowerW: number;
  maximumPressureRateKPaPerS: number;
  maximumTemperatureRateCPerS: number;
  safetyEvents: string[];
  acceptanceCriteriaSatisfied: boolean;
};

export type DesignSynthesisResult = {
  status: "ENGINEERING_REVIEW_REQUIRED" | "BLOCKED";
  designInputs: {
    designPressureMPa: number;
    designTemperatureC: number;
    heatingPowerW: number;
    coolingPowerW: number;
  };
  evidence: SimulationDesignEvidence;
  blockers: string[];
};

/**
 * Converts an already-produced simulation evidence envelope into controlled
 * engineering design inputs. It does not calculate pressure-vessel wall
 * thickness or certify component ratings.
 */
export function synthesizeDesignInputs(evidence: SimulationDesignEvidence): DesignSynthesisResult {
  const blockers: string[] = [];

  if (!evidence.simulationRunId || !evidence.validationReportId) {
    blockers.push("Simulation run and validation report IDs are required.");
  }
  if (!evidence.hardwareModelVersion) blockers.push("Hardware model version is required.");
  if (!evidence.acceptanceCriteriaSatisfied) blockers.push("Simulation acceptance criteria are not satisfied.");
  if (evidence.safetyEvents.length > 0) blockers.push("Simulation contains safety events requiring engineering review.");
  if (evidence.peakAbsolutePressureMPa <= 0) blockers.push("Peak absolute pressure must be positive.");
  if (evidence.peakTemperatureC <= evidence.minimumTemperatureC) blockers.push("Temperature envelope is invalid.");

  return {
    status: blockers.length === 0 ? "ENGINEERING_REVIEW_REQUIRED" : "BLOCKED",
    designInputs: {
      designPressureMPa: evidence.peakAbsolutePressureMPa,
      designTemperatureC: evidence.peakTemperatureC,
      heatingPowerW: evidence.peakHeatingPowerW,
      coolingPowerW: evidence.peakCoolingPowerW,
    },
    evidence,
    blockers,
  };
}
