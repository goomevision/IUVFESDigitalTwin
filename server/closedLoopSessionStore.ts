import type { ClosedLoopSnapshot } from './closedLoopSimulation';

export type ClosedLoopSessionStatus = 'running' | 'paused' | 'completed' | 'failed' | 'stopped';

export interface ClosedLoopSession {
  experimentId: string;
  status: ClosedLoopSessionStatus;
  lastStep: number;
  frameCount: number;
  snapshot: ClosedLoopSnapshot;
  updatedAt: number;
}

/**
 * Process-local persistence boundary used by the closed-loop router.
 * The snapshot remains the source of truth, so this can later be replaced by
 * durable storage without changing the simulation engine contract.
 */
const sessions = new Map<string, ClosedLoopSession>();

export async function getClosedLoopSession(experimentId: string): Promise<ClosedLoopSession | null> {
  return sessions.get(experimentId) ?? null;
}

export async function saveClosedLoopSession(
  experimentId: string,
  status: ClosedLoopSessionStatus,
  snapshot: ClosedLoopSnapshot,
): Promise<ClosedLoopSession> {
  const session: ClosedLoopSession = {
    experimentId,
    status,
    lastStep: snapshot.stepNumber,
    frameCount: snapshot.frames.length,
    snapshot,
    updatedAt: Date.now(),
  };
  sessions.set(experimentId, session);
  return session;
}

export function clearClosedLoopSession(experimentId: string): void {
  sessions.delete(experimentId);
}
