/** Scientific data contract for IUVFES experiments, simulations and provenance. */

export type DataQualityStatus =
  | 'RAW'
  | 'VALIDATED'
  | 'REVIEWED'
  | 'CALIBRATED'
  | 'REPLICATED'
  | 'PUBLISHED'
  | 'RETRACTED'
  | 'SUPERSEDED';

export type DataOrigin = 'EXPERIMENTAL' | 'SIMULATION' | 'DERIVED' | 'AI_ANALYSIS';

export interface ProvenanceRef {
  id: string;
  type: string;
  role: string;
}

export interface DatasetManifest {
  datasetId: string;
  version: string;
  title: string;
  description?: string;
  origin: DataOrigin;
  qualityStatus: DataQualityStatus;
  createdAt: string;
  createdBy: string;
  experimentId?: string;
  simulationId?: string;
  materialId?: string;
  instrumentIds: string[];
  calibrationIds: string[];
  softwareVersion: string;
  modelVersion?: string;
  analysisVersion?: string;
  provenance: ProvenanceRef[];
  sha256?: string;
  license?: string;
  doi?: string;
}

export interface ExperimentRecord {
  experimentId: string;
  protocolVersion: string;
  title: string;
  objective: string;
  hypothesis?: string;
  researcherIds: string[];
  materialSampleId: string;
  instrumentIds: string[];
  calibrationIds: string[];
  inputParameters: Record<string, unknown>;
  environmentalConditions?: Record<string, unknown>;
  procedure: string[];
  startedAt: string;
  endedAt?: string;
  status: 'PLANNED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  rawDatasetId?: string;
  processedDatasetId?: string;
  simulationId?: string;
  notes?: string;
}

export interface ScientificFinding {
  findingId: string;
  experimentIds: string[];
  datasetIds: string[];
  statement: string;
  evidence: string[];
  confidence?: number;
  status: 'OBSERVATION' | 'HYPOTHESIS' | 'SUPPORTED' | 'REJECTED';
  createdAt: string;
  createdBy: string;
}

export interface JournalReportManifest {
  reportId: string;
  experimentIds: string[];
  datasetIds: string[];
  findingIds: string[];
  title: string;
  version: string;
  generatedAt: string;
  generatedBy: string;
  softwareVersion: string;
  modelVersions: string[];
  sections: string[];
  rawDataAvailable: boolean;
  supplementaryDataAvailable: boolean;
}
