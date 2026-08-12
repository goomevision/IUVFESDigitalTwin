import { randomUUID } from "node:crypto";
import type { CausalFrame } from "./closedLoopSimulation";
import type { RawDatasetObject, RawDatasetStore } from "./scientificRawDatasetStore";

export interface SimulationRawDatasetManifest {
  datasetId: string;
  experimentId: string;
  version: string;
  origin: "SIMULATION";
  qualityStatus: "RAW";
  sha256: string;
  storageRef: string;
  byteLength: number;
  frameCount: number;
  firstStep: number | null;
  lastStep: number | null;
  provenanceRefs: string[];
  createdAt: string;
}

export interface PersistedSimulationRawDataset {
  manifest: SimulationRawDatasetManifest;
  object: RawDatasetObject;
  bytes: Buffer;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonicalize(item)]));
  }
  return value;
}

export function serializeSimulationFrames(frames: CausalFrame[]): Buffer {
  const payload = {
    schema: "iuvfes.simulation.raw.v1",
    origin: "SIMULATION",
    frames,
  };
  return Buffer.from(JSON.stringify(canonicalize(payload)) + "\n", "utf8");
}

export async function persistSimulationRawDataset(input: {
  experimentId: string;
  frames: CausalFrame[];
  store: RawDatasetStore;
  provenanceRefs?: string[];
  datasetId?: string;
}): Promise<PersistedSimulationRawDataset> {
  if (input.frames.length === 0) throw new Error("RAW_DATASET_EMPTY_SIMULATION");
  const datasetId = input.datasetId ?? randomUUID();
  const bytes = serializeSimulationFrames(input.frames);
  const object = await input.store.putImmutable(datasetId, bytes);
  const manifest: SimulationRawDatasetManifest = {
    datasetId,
    experimentId: input.experimentId,
    version: "1.0.0",
    origin: "SIMULATION",
    qualityStatus: "RAW",
    sha256: object.sha256,
    storageRef: object.storageRef,
    byteLength: object.byteLength,
    frameCount: input.frames.length,
    firstStep: input.frames[0]?.step ?? null,
    lastStep: input.frames[input.frames.length - 1]?.step ?? null,
    provenanceRefs: [...new Set(input.provenanceRefs ?? [])],
    createdAt: new Date().toISOString(),
  };
  return { manifest, object, bytes };
}
