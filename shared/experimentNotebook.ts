export type NotebookExperimentStatus = 'draft' | 'ready' | 'running' | 'paused' | 'completed' | 'failed' | 'reviewed';
export type DataOrigin = 'EXPERIMENTAL' | 'SIMULATION' | 'DERIVED' | 'AI_ANALYSIS';

export interface ExperimentNotebook {
  experimentId: string;
  title: string;
  status: NotebookExperimentStatus;
  researcherId: string;
  objective: string;
  hypothesis?: string;
  material: { materialId: string; sampleId: string; batchId?: string; massKg: number };
  equipment: Array<{ instrumentId: string; role: string; calibrationId?: string }>;
  environment?: { ambientTemperatureC?: number; ambientPressureMbar?: number; humidityPercent?: number };
  procedure: string[];
  inputParameters: Record<string, number | string | boolean>;
  notes: Array<{ timestamp: string; authorId: string; text: string; eventId?: string }>;
  observations: Array<{ timestamp: string; parameter: string; value: number | string; unit?: string; source: 'SENSOR' | 'OPERATOR' }>; 
  datasetIds: string[];
  simulationIds: string[];
  provenanceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentStartRequest {
  title: string;
  researcherId: string;
  objective: string;
  hypothesis?: string;
  material: ExperimentNotebook['material'];
  equipment: ExperimentNotebook['equipment'];
  environment?: ExperimentNotebook['environment'];
  procedure: string[];
  inputParameters: ExperimentNotebook['inputParameters'];
}

export interface ExperimentCloseout {
  experimentId: string;
  outcome: 'SUCCESS' | 'FAILED' | 'ABORTED' | 'INCONCLUSIVE';
  conclusion: string;
  anomalies: string[];
  rawDatasetId: string;
  processedDatasetId?: string;
  digitalTwinSimulationId?: string;
  findings: string[];
}
