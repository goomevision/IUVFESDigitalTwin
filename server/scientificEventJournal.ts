import { createHash, randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import type { ClosedLoopResult } from "./closedLoopSimulation";

export interface ScientificEvent {
  id: string;
  experimentId: string;
  sequence: number;
  eventType: string;
  stage?: string;
  occurredAt: string;
  source: string;
  payload: Record<string, unknown>;
  previousHash: string | null;
  eventHash: string;
}

export interface EventJournalInput {
  experimentId: string;
  sequence: number;
  eventType: string;
  stage?: string;
  occurredAt: Date;
  source: string;
  payload: Record<string, unknown>;
  previousHash: string | null;
}

/** Stable JSON representation used for reproducible event hashes. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`).join(",")}}`;
}

export function hashEvent(input: EventJournalInput): string {
  const canonical = canonicalize({
    experimentId: input.experimentId,
    sequence: input.sequence,
    eventType: input.eventType,
    stage: input.stage ?? null,
    occurredAt: input.occurredAt.toISOString(),
    source: input.source,
    payload: input.payload,
    previousHash: input.previousHash,
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function buildEvent(input: EventJournalInput): ScientificEvent {
  return {
    id: randomUUID(),
    experimentId: input.experimentId,
    sequence: input.sequence,
    eventType: input.eventType,
    stage: input.stage,
    occurredAt: input.occurredAt.toISOString(),
    source: input.source,
    payload: input.payload,
    previousHash: input.previousHash,
    eventHash: hashEvent(input),
  };
}

export function buildCausalEvents(experimentId: string, result: ClosedLoopResult, source = "closed-loop-simulator"): ScientificEvent[] {
  let previousHash: string | null = null;
  const events: ScientificEvent[] = [];

  for (const frame of result.frames) {
    const event = buildEvent({
      experimentId,
      sequence: frame.step,
      eventType: "CAUSAL_STEP",
      stage: frame.controller.stage,
      occurredAt: new Date(frame.timestampSeconds * 1000),
      source,
      payload: {
        timestampSeconds: frame.timestampSeconds,
        sensorBefore: frame.sensorBefore,
        controller: frame.controller,
        sensorAfter: frame.sensorAfter,
      },
      previousHash,
    });
    events.push(event);
    previousHash = event.eventHash;
  }

  const lastFrame = result.frames.length > 0 ? result.frames[result.frames.length - 1] : undefined;
  events.push(buildEvent({
    experimentId,
    sequence: result.frames.length + 1,
    eventType: "RUN_TERMINAL",
    stage: result.status,
    occurredAt: new Date((lastFrame?.timestampSeconds ?? 0) * 1000),
    source,
    payload: {
      status: result.status,
      finalSensors: result.finalSensors,
      frameCount: result.frames.length,
      pausedSteps: result.pausedSteps,
    },
    previousHash,
  }));

  return events;
}

export async function appendEventJournal(events: ScientificEvent[]): Promise<void> {
  if (events.length === 0) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const event of events) {
    await db.execute(sql`
      INSERT INTO scientificEventJournal
        (id, experimentId, sequence, eventType, stage, occurredAt, source, payload, previousHash, eventHash)
      VALUES
        (${event.id}, ${event.experimentId}, ${event.sequence}, ${event.eventType}, ${event.stage ?? null},
         ${new Date(event.occurredAt)}, ${event.source}, ${JSON.stringify(event.payload)},
         ${event.previousHash}, ${event.eventHash})
    `);
  }
}

export async function recordClosedLoopRun(experimentId: string, result: ClosedLoopResult): Promise<ScientificEvent[]> {
  const events = buildCausalEvents(experimentId, result);
  await appendEventJournal(events);
  return events;
}
