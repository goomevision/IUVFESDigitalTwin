import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionStoreMocks = vi.hoisted(() => ({
  getClosedLoopSessionById: vi.fn(),
  getClosedLoopSession: vi.fn(),
}));

vi.mock("./closedLoopSessionStore", () => sessionStoreMocks);

describe("closed-loop runtime recovery", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("rehydrates an in-memory session from the persisted snapshot", async () => {
    const configuration = {
      targetPressureMbar: 100,
      targetTemperatureC: 60,
      coolingTemperatureC: 35,
      materialWeightKg: 10,
      waterContentPercent: 45,
      oilContentPercent: 3.5,
      dtSeconds: 1,
      maxSteps: 20,
    };

    const { createRuntimeSession, startRuntimeSession, stepRuntimeSession, getRuntimeSnapshot } =
      await import("./closedLoopRuntimeStore");

    const session = createRuntimeSession("experiment-recovery-test", configuration);
    startRuntimeSession(session.sessionId);
    const firstFrame = stepRuntimeSession(session.sessionId);
    const persistedSnapshot = getRuntimeSnapshot(session.sessionId);

    expect(firstFrame).not.toBeNull();
    expect(persistedSnapshot.stepNumber).toBe(1);
    expect(persistedSnapshot.frames).toHaveLength(1);

    sessionStoreMocks.getClosedLoopSessionById.mockResolvedValue({
      id: session.sessionId,
      experimentId: session.experimentId,
      status: "running",
      snapshot: persistedSnapshot,
      frameCount: persistedSnapshot.frames.length,
      lastStep: persistedSnapshot.stepNumber,
    });

    // Simulate process-local memory loss by reloading the runtime module.
    vi.resetModules();
    const recoveredModule = await import("./closedLoopRuntimeStore");
    const recovered = await recoveredModule.ensureRuntimeSession(session.sessionId);

    expect(sessionStoreMocks.getClosedLoopSessionById).toHaveBeenCalledWith(session.sessionId);
    expect(recovered.sessionId).toBe(session.sessionId);
    expect(recovered.experimentId).toBe("experiment-recovery-test");
    expect(recovered.status).toBe("running");

    const recoveredSnapshot = recoveredModule.getRuntimeSnapshot(session.sessionId);
    expect(recoveredSnapshot.stepNumber).toBe(persistedSnapshot.stepNumber);
    expect(recoveredSnapshot.frames).toHaveLength(persistedSnapshot.frames.length);
    expect(recoveredSnapshot.sensors).toEqual(persistedSnapshot.sensors);
    expect(recoveredSnapshot.frames.at(-1)?.step).toBe(persistedSnapshot.frames.at(-1)?.step);
  });

  it("resolves a persisted session by experimentId after process-local memory loss", async () => {
    const configuration = {
      targetPressureMbar: 100,
      targetTemperatureC: 60,
      coolingTemperatureC: 35,
      materialWeightKg: 10,
      waterContentPercent: 45,
      oilContentPercent: 3.5,
      dtSeconds: 1,
      maxSteps: 20,
    };

    const { createRuntimeSession, getRuntimeSnapshot } = await import("./closedLoopRuntimeStore");
    const session = createRuntimeSession("experiment-refresh-test", configuration);
    const persistedSnapshot = getRuntimeSnapshot(session.sessionId);

    sessionStoreMocks.getClosedLoopSession.mockResolvedValue({
      id: session.sessionId,
      experimentId: session.experimentId,
      status: "stopped",
      snapshot: persistedSnapshot,
      frameCount: persistedSnapshot.frames.length,
      lastStep: persistedSnapshot.stepNumber,
    });

    vi.resetModules();
    const recoveredModule = await import("./closedLoopRuntimeStore");
    const recovered = await recoveredModule.ensureRuntimeSession("experiment-refresh-test");

    expect(sessionStoreMocks.getClosedLoopSession).toHaveBeenCalledWith("experiment-refresh-test");
    expect(recovered.sessionId).toBe(session.sessionId);
    expect(recovered.experimentId).toBe("experiment-refresh-test");
    expect(recovered.status).toBe("created");
    expect(recoveredModule.getRuntimeSnapshot(recovered.sessionId).stepNumber).toBe(0);
  });
});