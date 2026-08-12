import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { FilesystemRawDatasetStore, type RawDatasetStore } from "./scientificRawDatasetStore";
import { persistSimulationRawDataset, type PersistedSimulationRawDataset } from "./scientificSimulationRawDataset";

let defaultStore: RawDatasetStore | null = null;

function getDefaultStore(): RawDatasetStore {
  if (!defaultStore) {
    const root = process.env.IUVFES_RAW_DATASET_DIR ?? "./data/raw-datasets";
    defaultStore = new FilesystemRawDatasetStore(root);
  }
  return defaultStore;
}

export async function persistCompletedSimulationRawDataset(input: {
  experimentId: string;
  frames: Parameters<typeof persistSimulationRawDataset>[0]["frames"];
  provenanceRefs?: string[];
  store?: RawDatasetStore;
}): Promise<PersistedSimulationRawDataset> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const provenanceId = randomUUID();
  const dataset = await persistSimulationRawDataset({
    experimentId: input.experimentId,
    frames: input.frames,
    provenanceRefs: [provenanceId, ...(input.provenanceRefs ?? [])],
    store: input.store ?? getDefaultStore(),
  });

  const metadata = {
    frameCount: dataset.manifest.frameCount,
    firstStep: dataset.manifest.firstStep,
    lastStep: dataset.manifest.lastStep,
    provenanceRefs: dataset.manifest.provenanceRefs,
    byteLength: dataset.manifest.byteLength,
  };

  await db.execute(sql`
    INSERT INTO datasetManifests
      (id, experimentId, version, origin, qualityStatus, sha256, storageRef, metadata)
    VALUES
      (${dataset.manifest.datasetId}, ${dataset.manifest.experimentId}, ${dataset.manifest.version}, ${dataset.manifest.origin}, ${dataset.manifest.qualityStatus}, ${dataset.manifest.sha256}, ${dataset.manifest.storageRef}, ${JSON.stringify(metadata)})
  `);

  await db.execute(sql`
    INSERT INTO provenanceRecords
      (id, entityId, activityId, agentId, inputRefs, outputRefs)
    VALUES
      (${provenanceId}, ${dataset.manifest.datasetId}, ${`simulation:${input.experimentId}`}, ${"IUVFES-CLOSED-LOOP"},
       ${JSON.stringify({ experimentId: input.experimentId, frameCount: dataset.manifest.frameCount })},
       ${JSON.stringify({ datasetId: dataset.manifest.datasetId, sha256: dataset.manifest.sha256, storageRef: dataset.manifest.storageRef })})
  `);

  return dataset;
}
