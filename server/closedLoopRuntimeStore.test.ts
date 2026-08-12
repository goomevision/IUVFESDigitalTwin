import { describe, expect, it } from "vitest";
import {
  createRuntimeSession,
  getRuntimeSnapshot,
  getRuntimeSession,
  pauseRuntimeSession,
  resetRuntimeSession,
  resumeRuntimeSession,
  startRuntimeSession,
  stepRuntimeSession,
  stopRuntimeSession,
} from "./closedLoopRuntimeStore";

function config() {
  return {
    targetPressureMbar: 80,
    targetTemperatureC: 55,
    materialWeightKg: 10,
    waterContentPercent: 65,
    oilContentPercent: 3,
    dtSeconds: 1,
    maxSteps: 20,
  };
}

describe("closed-loop runtime session", () => {
  it("creates and starts a real engine-backed session", () => {
    const session = createRuntimeSession("exp-1", config());
    expect(session.status).toBe("created");
    startRuntimeSession(session.sessionId);
    expect(getRuntimeSession(session.sessionId).status).toBe("running");
  });

  it("advances exactly one engine timestep", () => {
    const session = createRuntimeSession("exp-2", config());
    startRuntimeSession(session.sessionId);
    const frame = stepRuntimeSession(session.sessionId);
    expect(frame).not.toBeNull();
    expect(frame?.step).toBe(1);
    expect(frame?.timestampSeconds).toBe(1);
    expect(getRuntimeSnapshot(session.sessionId).stepNumber).toBe(1);
  });

  it("does not advance while paused", () => {
    const session = createRuntimeSession("exp-3", config());
    startRuntimeSession(session.sessionId);
    stepRuntimeSession(session.sessionId);
    pauseRuntimeSession(session.sessionId);
    expect(stepRuntimeSession(session.sessionId)).toBeNull();
    expect(getRuntimeSnapshot(session.sessionId).stepNumber).toBe(1);
  });

  it("resumes and continues from the same state", () => {
    const session = createRuntimeSession("exp-4", config());
    startRuntimeSession(session.sessionId);
    stepRuntimeSession(session.sessionId);
    pauseRuntimeSession(session.sessionId);
    resumeRuntimeSession(session.sessionId);
    const frame = stepRuntimeSession(session.sessionId);
    expect(frame?.step).toBe(2);
    expect(frame?.timestampSeconds).toBe(2);
  });

  it("isolates two sessions", () => {
    const first = createRuntimeSession("exp-a", config());
    const second = createRuntimeSession("exp-b", { ...config(), targetTemperatureC: 80 });
    startRuntimeSession(first.sessionId);
    startRuntimeSession(second.sessionId);
    stepRuntimeSession(first.sessionId);
    expect(getRuntimeSnapshot(first.sessionId).stepNumber).toBe(1);
    expect(getRuntimeSnapshot(second.sessionId).stepNumber).toBe(0);
  });

  it("marks a max-step terminal frame completed immediately", () => {
    const session = createRuntimeSession("exp-terminal", { ...config(), maxSteps: 1 });
    startRuntimeSession(session.sessionId);
    const frame = stepRuntimeSession(session.sessionId);
    expect(frame).not.toBeNull();
    expect(getRuntimeSession(session.sessionId).status).toBe("completed");
  });

  it("resets the engine-backed session", () => {
    const session = createRuntimeSession("exp-5", config());
    startRuntimeSession(session.sessionId);
    stepRuntimeSession(session.sessionId);
    resetRuntimeSession(session.sessionId);
    expect(getRuntimeSession(session.sessionId).status).toBe("created");
    expect(getRuntimeSnapshot(session.sessionId).stepNumber).toBe(0);
    expect(getRuntimeSnapshot(session.sessionId).frames).toHaveLength(0);
  });

  it("stops without destroying the current snapshot", () => {
    const session = createRuntimeSession("exp-6", config());
    startRuntimeSession(session.sessionId);
    stepRuntimeSession(session.sessionId);
    stopRuntimeSession(session.sessionId);
    expect(getRuntimeSession(session.sessionId).status).toBe("stopped");
    expect(getRuntimeSnapshot(session.sessionId).stepNumber).toBe(1);
  });
});
