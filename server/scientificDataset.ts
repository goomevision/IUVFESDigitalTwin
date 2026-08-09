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
}): DatasetManifest {
  return {
    datasetId: input.datasetId,
    version: input.version,
    name: input.name,
    origin: input.origin,
    qualityStatus: input.qualityStatus,
    sha256: sha256Utf8(input.content),
    storageRef: input.storageRef,
    experimentIds: [...new Set(input.experimentIds)],
    provenanceRefs: [...new Set(input.provenanceRefs)],
    createdAt: new Date().toISOString(),
  };
}
