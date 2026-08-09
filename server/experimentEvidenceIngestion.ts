export type ExperimentObservation = {
  parameter: string;
  value: number;
  unit: string;
  uncertainty?: number;
  condition?: string;
};

export type ExperimentRecord = {
  experimentId: string;
  materialId: string;
  materialRevisionId: string;
  startedAt: string;
  operatorId: string;
  protocolId: string;
  observations: ExperimentObservation[];
  rawEvidenceIds: string[];
  notes?: string;
};

export type EvidenceRecord = {
  evidenceId: string;
  experimentId: string;
  materialId: string;
  parameter: string;
  value: number;
  unit: string;
  uncertainty?: number;
  condition?: string;
  provenance: "EXPERIMENT";
  status: "OBSERVED";
};

/** Converts only explicit experimental observations into evidence records. */
export function ingestExperimentEvidence(record: ExperimentRecord): EvidenceRecord[] {
  if (!record.experimentId || !record.materialId || !record.materialRevisionId || !record.protocolId || !record.operatorId) {
    throw new Error("Experiment record is missing required provenance fields.");
  }
  if (record.rawEvidenceIds.length === 0) throw new Error("Experiment must reference raw evidence before ingestion.");
  return record.observations.map((observation, index) => {
    if (!observation.parameter || !Number.isFinite(observation.value) || !observation.unit) {
      throw new Error(`Invalid observation at index ${index}.`);
    }
    if (observation.uncertainty !== undefined && (!Number.isFinite(observation.uncertainty) || observation.uncertainty < 0)) {
      throw new Error(`Invalid uncertainty at index ${index}.`);
    }
    return {
      evidenceId: `${record.experimentId}:${index + 1}`,
      experimentId: record.experimentId,
      materialId: record.materialId,
      parameter: observation.parameter,
      value: observation.value,
      unit: observation.unit,
      uncertainty: observation.uncertainty,
      condition: observation.condition,
      provenance: "EXPERIMENT",
      status: "OBSERVED",
    };
  });
}
