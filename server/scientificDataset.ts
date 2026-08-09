import { createHash } from 'node:crypto';
import type { DataOrigin, DataQualityStatus, DatasetManifest } from '@shared/scientificData';

export function sha256Utf8(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export function buildDatasetManifest(input: {
  datasetId: string;
  version: string;
  name: string;
  origin: DataOrigin;
  qualityStatus: DataQualityStatus;
  content: string;
  storageRef: string;
  experimentIds: string[];
  provenanceRefs: string[];
  createdBy?: string;
  softwareVersion?: string;
}): DatasetManifest {
  const uniqueExperimentIds = [...new Set(input.experimentIds)];
  const uniqueProvenanceRefs = [...new Set(input.provenanceRefs)];
  return {
    datasetId: input.datasetId,
    version: input.version,
    title: input.name,
    description: 'IUVFES scientific dataset manifest',
    origin: input.origin,
    qualityStatus: input.qualityStatus,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy ?? 'system',
    experimentId: uniqueExperimentIds[0],
    instrumentIds: [],
    calibrationIds: [],
    softwareVersion: input.softwareVersion ?? 'unknown',
    provenance: uniqueProvenanceRefs.map((id) => ({ id, type: 'REFERENCE', role: 'SOURCE' })),
    sha256: sha256Utf8(input.content),
    license: undefined,
    doi: undefined,
    storageRef: input.storageRef,
    experimentIds: uniqueExperimentIds,
    provenanceRefs: uniqueProvenanceRefs,
  } as DatasetManifest & {
    storageRef: string;
    experimentIds: string[];
    provenanceRefs: string[];
  };
}
