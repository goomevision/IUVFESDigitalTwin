import { ClosedLoopSimulationEngine, type ClosedLoopSimulationConfig } from "./closedLoopSimulation";

export interface LiveSession {
  engine: ClosedLoopSimulationEngine;
  ownerId: number;
  experimentId: string;
}

const sessions = new Map<string, LiveSession>();

export function createSession(experimentId: string, ownerId: number, config: ClosedLoopSimulationConfig): LiveSession {
  const session: LiveSession = {
    engine: new ClosedLoopSimulationEngine(config),
    ownerId,
    experimentId,
  };
  sessions.set(experimentId, session);
  return session;
}

export function getSession(experimentId: string, ownerId: number): LiveSession | undefined {
  const session = sessions.get(experimentId);
  if (!session || session.ownerId !== ownerId) return undefined;
  return session;
}

export function deleteSession(experimentId: string, ownerId: number): void {
  const session = sessions.get(experimentId);
  if (session?.ownerId === ownerId) sessions.delete(experimentId);
}
