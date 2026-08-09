export type SimulationDesignEvidence = {
  simulationRunId: string;
  validationReportId: string;
  datasetIds: string[];
  hardwareModelVersion: string;
  modelVersion: string;
  equationIds: string[];
  keyOutputs: Record<string, number | string>;
  assumptions: string[];
  uncertainties: string[];
};

export type BoundDesignEvidence = SimulationDesignEvidence & {
  evidenceStatus: "TRACEABLE" | "INCOMPLETE";
  blockers: string[];
};

export function bindSimulationEvidence(input: SimulationDesignEvidence): BoundDesignEvidence {
  const blockers: string[] = [];
  if (!input.simulationRunId) blockers.push("Missing simulation run ID.");
  if (!input.validationReportId) blockers.push("Missing validation report ID.");
  if (!input.hardwareModelVersion) blockers.push("Missing hardware model version.");
  if (!input.modelVersion) blockers.push("Missing physics/model version.");
  if (input.datasetIds.length === 0) blockers.push("No dataset evidence linked.");
  if (input.equationIds.length === 0) blockers.push("No governing equation IDs linked.");

  return {
    ...input,
    evidenceStatus: blockers.length === 0 ? "TRACEABLE" : "INCOMPLETE",
    blockers,
  };
}
