import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
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

export async function saveClosedLoopSession(
  experimentId: string,
  status: ClosedLoopSessionStatus,
  snapshot: ClosedLoopSnapshot,
): Promise<ClosedLoopSessionRecord> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = randomUUID();
  const snapshotJson = JSON.stringify(snapshot);
  await db.execute(sql`
    INSERT INTO closedLoopSessions (id, experimentId, status, snapshot, frameCount, lastStep)
    VALUES (${id}, ${experimentId}, ${status}, ${snapshotJson}, ${snapshot.frames.length}, ${snapshot.stepNumber})
    ON DUPLICATE KEY UPDATE
      status = VALUES(status), snapshot = VALUES(snapshot), frameCount = VALUES(frameCount), lastStep = VALUES(lastStep)
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
  if (!row) return null;
  const snapshotValue = row.snapshot;
  const snapshot = typeof snapshotValue === "string" ? JSON.parse(snapshotValue) : snapshotValue;
  return {
    id: String(row.id),
    experimentId: String(row.experimentId),
    status: row.status as ClosedLoopSessionStatus,
    snapshot: snapshot as ClosedLoopSnapshot,
    frameCount: Number(row.frameCount),
    lastStep: Number(row.lastStep),
  };
}
