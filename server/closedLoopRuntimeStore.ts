import { randomUUID } from "crypto";
import { ClosedLoopSimulationEngine, type CausalFrame, type ClosedLoopSimulationConfig, type ClosedLoopSnapshot } from "./closedLoopSimulation";

export type ClosedLoopRuntimeStatus = "created" | "running" | "paused" | "stopped" | "completed" | "fault";

export interface ClosedLoopRuntimeSession {
  sessionId: string;
  experimentId: string;
  status: ClosedLoopRuntimeStatus;
  createdAt: string;
  startedAt?: string;
  updatedAt: string;
  configuration: ClosedLoopSimulationConfig;
  engine: ClosedLoopSimulationEngine;
}

const sessions = new Map<string, ClosedLoopRuntimeSession>();

function now(): string {
  return new Date().toISOString();
}

function assertSession(sessionId: string): ClosedLoopRuntimeSession {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Closed-loop session not found: ${sessionId}`);
  return session;
}

function refreshStatus(session: ClosedLoopRuntimeSession): void {
  if (session.status === "stopped") return;
  const snapshot = session.engine.getSnapshot();
  if (snapshot.state.stage === "FAULT") {
    session.status = "fault";
    return;
  }
  if (snapshot.state.stage === "COMPLETE" || snapshot.stepNumber >= (session.configuration.maxSteps ?? Number.MAX_SAFE_INTEGER)) {
    session.status = "completed";
  }
}

export function createRuntimeSession(
  experimentId: string,
  configuration: ClosedLoopSimulationConfig,
): ClosedLoopRuntimeSession {
  const sessionId = randomUUID();
  const timestamp = now();
  const session: ClosedLoopRuntimeSession = {
    sessionId,
    experimentId,
    status: "created",
    createdAt: timestamp,
    updatedAt: timestamp,
    configuration: { ...configuration },
    engine: new ClosedLoopSimulationEngine(configuration),
  };
  sessions.set(sessionId, session);
  return session;
}

export function getRuntimeSession(sessionId: string): ClosedLoopRuntimeSession {
  return assertSession(sessionId);
}

export function startRuntimeSession(sessionId: string): ClosedLoopRuntimeSession {
  const session = assertSession(sessionId);
  if (session.status === "completed" || session.status === "stopped" || session.status === "fault") return session;
  session.engine.resume();
  session.status = "running";
  session.startedAt ??= now();
  session.updatedAt = now();
  return session;
}

export function pauseRuntimeSession(sessionId: string): ClosedLoopRuntimeSession {
  const session = assertSession(sessionId);
  session.engine.pause();
  session.status = "paused";
  session.updatedAt = now();
  return session;
}

export function resumeRuntimeSession(sessionId: string): ClosedLoopRuntimeSession {
  const session = assertSession(sessionId);
  if (session.status === "stopped" || session.status === "fault" || session.status === "completed") return session;
  session.engine.resume();
  session.status = "running";
  session.updatedAt = now();
  return session;
}

export function stepRuntimeSession(sessionId: string): CausalFrame | null {
  const session = assertSession(sessionId);
  if (session.status !== "running") return null;
  const frame = session.engine.step();
  session.updatedAt = now();
  refreshStatus(session);
  return frame;
}

export function stopRuntimeSession(sessionId: string): ClosedLoopRuntimeSession {
  const session = assertSession(sessionId);
  session.engine.pause();
  session.status = "stopped";
  session.updatedAt = now();
  return session;
}

export function resetRuntimeSession(sessionId: string): ClosedLoopRuntimeSession {
  const session = assertSession(sessionId);
  session.engine.reset();
  session.status = "created";
  session.startedAt = undefined;
  session.updatedAt = now();
  return session;
}

export function getRuntimeSnapshot(sessionId: string): ClosedLoopSnapshot {
  return assertSession(sessionId).engine.getSnapshot();
}

export function getRuntimeFrames(sessionId: string): CausalFrame[] {
  return assertSession(sessionId).engine.getFrames();
}

export function removeRuntimeSession(sessionId: string): void {
  sessions.delete(sessionId);
}
