import { extractSimulationEvidence, SimulationRunResult, ExtractedSimulationEvidence } from "./simulationEvidenceExtractor";
import { analyzeOneAtATimeSensitivity, ParameterRange, UncertaintySensitivityResult } from "./uncertaintySensitivityEngine";

export type StudyEvidenceState = {
  studyId: string;
  simulationEvidence: ExtractedSimulationEvidence[];
  sensitivityEvidence: UncertaintySensitivityResult[];
  lastUpdatedSimulationRunId?: string;
};

export function integrateSimulationIntoStudy(
  current: StudyEvidenceState,
  run: SimulationRunResult,
  parameters: ParameterRange[],
  evaluate: (parameterId: string, value: number) => number,
): StudyEvidenceState {
  if (!run.simulationRunId) throw new Error("Simulation run ID is required.");
  const evidence = extractSimulationEvidence(run);
  const sensitivity = analyzeOneAtATimeSensitivity(parameters, evaluate);

  return {
    ...current,
    simulationEvidence: [...current.simulationEvidence.filter((item) => item.simulationRunId !== evidence.simulationRunId), evidence],
    sensitivityEvidence: sensitivity,
    lastUpdatedSimulationRunId: evidence.simulationRunId,
  };
}
