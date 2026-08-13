import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import type { ClosedLoopSnapshot } from "./closedLoopSimulation";

export type ClosedLoopSessionStatus = "running" | "paused" | "completed" | "failed" | "stopped";

export interface ClosedLoopSessionRecord {
  id: string;
  experimentId: string;
  status: ClosedLoopSessionStatus;
  snapshot: ClosedLoopSnapshot;
  frameCount: number;
  lastStep: number;
}

function parseSnapshot(value: unknown): ClosedLoopSnapshot {
  return (typeof value === "string" ? JSON.parse(value) : value) as ClosedLoopSnapshot;
}

function mapRow(row: Record<string, unknown>): ClosedLoopSessionRecord {
  return {
    id: String(row.id),
    experimentId: String(row.experimentId),
    status: row.status as ClosedLoopSessionStatus,
    snapshot: parseSnapshot(row.snapshot),
    frameCount: Number(row.frameCount),
    lastStep: Number(row.lastStep),
  };
}

export async function saveClosedLoopSession(
  experimentId: string,
  status: ClosedLoopSessionStatus,
  snapshot: ClosedLoopSnapshot,
  sessionId?: string,
): Promise<ClosedLoopSessionRecord> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = sessionId ?? randomUUID();
  const snapshotJson = JSON.stringify(snapshot);
  await db.execute(sql`
    INSERT INTO closedLoopSessions (id, experimentId, status, snapshot, frameCount, lastStep)
    VALUES (${id}, ${experimentId}, ${status}, ${snapshotJson}, ${snapshot.frames.length}, ${snapshot.stepNumber})
    ON DUPLICATE KEY UPDATE
      id = VALUES(id),
      status = VALUES(status),
      snapshot = VALUES(snapshot),
      frameCount = VALUES(frameCount),
      lastStep = VALUES(lastStep)
  `);
  const current = await getClosedLoopSession(experimentId);
  if (!current) throw new Error("Closed-loop session could not be persisted");
  return current;
}

export async function getClosedLoopSession(experimentId: string): Promise<ClosedLoopSessionRecord | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.execute(sql`
    SELECT id, experimentId, status, snapshot, frameCount, lastStep
    FROM closedLoopSessions WHERE experimentId = ${experimentId} LIMIT 1
  `);
  const rows = (Array.isArray(result) ? result[0] : []) as Array<Record<string, unknown>>;
  const row = rows[0];
  return row ? mapRow(row) : null;
}

export async function getClosedLoopSessionById(sessionId: string): Promise<ClosedLoopSessionRecord | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.execute(sql`
    SELECT id, experimentId, status, snapshot, frameCount, lastStep
    FROM closedLoopSessions WHERE id = ${sessionId} LIMIT 1
  `);
  const rows = (Array.isArray(result) ? result[0] : []) as Array<Record<string, unknown>>;
  const row = rows[0];
  return row ? mapRow(row) : null;
}
