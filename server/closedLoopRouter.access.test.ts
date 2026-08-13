import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, runtime } = vi.hoisted(() => ({
  db: {
    getExperiment: vi.fn(),
    updateExperimentStatus: vi.fn(),
    logControlAction: vi.fn(),
  },
  runtime: {
    getRuntimeSession: vi.fn(),
    getRuntimeSnapshot: vi.fn(),
    resetRuntimeSession: vi.fn(),
    createRuntimeSession: vi.fn(),
    getRuntimeFrames: vi.fn(),
    pauseRuntimeSession: vi.fn(),
    resumeRuntimeSession: vi.fn(),
    startRuntimeSession: vi.fn(),
    stepRuntimeSession: vi.fn(),
    stopRuntimeSession: vi.fn(),
    ensureRuntimeSession: vi.fn(),
  },
}));

vi.mock("./db", () => db);
vi.mock("./closedLoopRuntimeStore", () => runtime);
vi.mock("./closedLoopSessionStore", () => ({ saveClosedLoopSession: vi.fn() }));
vi.mock("./closedLoopWiring", () => ({
  getClosedLoopWiringReport: vi.fn(() => ({ status: "READY" })),
  inspectClosedLoopWiring: vi.fn(() => ({ status: "READY" })),
  mapExperimentInputsToEngine: vi.fn(),
}));

import { closedLoopRouter } from "./closedLoopRouter";

const sessionId = "session-001";
const experimentId = "experiment-owned-by-user";

function snapshot() {
  return {
    stepNumber: 0,
    elapsedSeconds: 0,
    paused: false,
    sensors: {},
    state: {},
    dynamics: {},
    control: { operatorLimits: {} },
    targets: {},
    ultrasonic: {},
    configuration: {},
    frames: [],
    pausedSteps: [],
  };
}

describe("closedLoopRouter reset access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runtime.ensureRuntimeSession.mockResolvedValue({
      sessionId,
      experimentId,
      status: "created",
      createdAt: "2026-08-12T00:00:00.000Z",
      updatedAt: "2026-08-12T00:00:00.000Z",
      configuration: {},
      engine: { getSnapshot: snapshot },
    });
    runtime.getRuntimeSession.mockReturnValue({
      sessionId,
      experimentId,
      status: "created",
      createdAt: "2026-08-12T00:00:00.000Z",
      updatedAt: "2026-08-12T00:00:00.000Z",
      configuration: {},
      engine: { getSnapshot: snapshot },
    });
    runtime.getRuntimeSnapshot.mockReturnValue(snapshot());
    db.getExperiment.mockResolvedValue({ id: experimentId, userId: 1 });
    db.updateExperimentStatus.mockResolvedValue(undefined);
  });

  it("authorizes reset against the runtime session's experiment, never the session identifier", async () => {
    const caller = closedLoopRouter.createCaller({ user: { id: 1, role: "user" } } as never);

    await caller.reset(sessionId);

    expect(runtime.ensureRuntimeSession).toHaveBeenCalledWith(sessionId);
    expect(db.getExperiment).toHaveBeenCalledWith(experimentId);
    expect(db.getExperiment).not.toHaveBeenCalledWith(sessionId);
    expect(runtime.resetRuntimeSession).toHaveBeenCalledWith(sessionId);
    expect(db.updateExperimentStatus).toHaveBeenCalledWith(experimentId, "draft");
  });
});
