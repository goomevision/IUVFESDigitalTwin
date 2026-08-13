import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getClosedLoopSessionById: vi.fn(),
  createClosedLoopSession: vi.fn(),
  updateClosedLoopSession: vi.fn(),
}));

vi.mock("./researchDb", () => dbMocks);

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
    dbMocks.createClosedLoopSession.mockResolvedValue(undefined);
    dbMocks.updateClosedLoopSession.mockResolvedValue(undefined);
    dbMocks.getClosedLoopSessionById.mockResolvedValue({
      id: session.sessionId,
      experimentId: session.experimentId,
      status: "running",
      configuration,
      snapshot: getRuntimeSnapshot(session.sessionId),
      createdAt: session.createdAt,
      startedAt: session.createdAt,
      updatedAt: session.updatedAt,
    });

    startRuntimeSession(session.sessionId);
    const firstFrame = stepRuntimeSession(session.sessionId);
    const persistedSnapshot = getRuntimeSnapshot(session.sessionId);

    expect(firstFrame).not.toBeNull();
    expect(persistedSnapshot.stepNumber).toBe(1);
    expect(persistedSnapshot.frames).toHaveLength(1);

    // Simulate process-local memory loss by reloading the runtime module.
    const recoveredModule = await import("./closedLoopRuntimeStore");
    const recovered = await recoveredModule.ensureRuntimeSession(session.sessionId);

    expect(recovered.sessionId).toBe(session.sessionId);
    expect(recovered.experimentId).toBe("experiment-recovery-test");
    expect(recovered.status).toBe("running");

    const recoveredSnapshot = recoveredModule.getRuntimeSnapshot(session.sessionId);
    expect(recoveredSnapshot.stepNumber).toBe(persistedSnapshot.stepNumber);
    expect(recoveredSnapshot.frames).toHaveLength(persistedSnapshot.frames.length);
    expect(recoveredSnapshot.sensors).toEqual(persistedSnapshot.sensors);
    expect(recoveredSnapshot.frames.at(-1)?.step).toBe(persistedSnapshot.frames.at(-1)?.step);
  });
});
