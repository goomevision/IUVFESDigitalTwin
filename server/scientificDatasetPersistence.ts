import { createHash, randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import type { ClosedLoopResult } from "./closedLoopSimulation";
import type { ScientificEvent } from "./scientificEventJournal";

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`).join(",`)}}`;
}

export interface PersistedScientificDataset {
  datasetId: string;
  provenanceId: string;
  sha256: string;
  eventHash: string | null;
  eventCount: number;
  qualityStatus: "RAW";
  researchExperimentId: string | null;
}

export async function persistSimulationDataset(input: {
  experimentId: string;
  researchExperimentId?: string | null;
  parameters: Record<string, unknown>;
  result: ClosedLoopResult;
  events: ScientificEvent[];
}): Promise<PersistedScientificDataset> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const datasetId = randomUUID();
  const provenanceId = randomUUID();
  const eventHash = input.events.length > 0 ? input.events[input.events.length - 1].eventHash : null;
  const payload = {
    schemaVersion: "1.0.0",
    origin: "SIMULATION",
    qualityStatus: "RAW",
    experimentId: input.experimentId,
    researchExperimentId: input.researchExperimentId ?? null,
    parameters: input.parameters,
    status: input.result.status,
    finalSensors: input.result.finalSensors,
    frames: input.result.frames,
    eventCount: input.events.length,
    eventHash,
  };
  const canonical = canonicalize(payload);
  const sha256 = createHash("sha256").update(canonical, "utf8").digest("hex");
  const storageRef = `inline://scientific-dataset/${datasetId}`;

  await db.execute(sql`
    INSERT INTO datasetManifests
      (id, experimentId, version, origin, qualityStatus, sha256, storageRef, metadata)
    VALUES
      (${datasetId}, ${input.researchExperimentId ?? null}, ${"1.0.0"}, ${"SIMULATION"}, ${"RAW"}, ${sha256}, ${storageRef}, ${JSON.stringify(payload)})
  `);

  await db.execute(sql`
    INSERT INTO provenanceRecords
      (id, entityId, activityId, agentId, inputRefs, outputRefs)
    VALUES
      (${provenanceId}, ${datasetId}, ${`simulation:${input.experimentId}`}, ${"IUVFES-CLOSED-LOOP"},
       ${JSON.stringify({ experimentId: input.experimentId, researchExperimentId: input.researchExperimentId ?? null, parameters: input.parameters })},
       ${JSON.stringify({ datasetId, sha256, eventHash })})
  `);

  return {
    datasetId,
    provenanceId,
    sha256,
    eventHash,
    eventCount: input.events.length,
    qualityStatus: "RAW",
    researchExperimentId: input.researchExperimentId ?? null,
  };
}
