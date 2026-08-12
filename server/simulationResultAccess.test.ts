import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, runtime } = vi.hoisted(() => ({
  db: { getExperiment: vi.fn() },
  runtime: { getRuntimeSession: vi.fn(), getRuntimeSnapshot: vi.fn() },
}));

vi.mock("./db", () => db);
vi.mock("./closedLoopRuntimeStore", () => runtime);
vi.mock("./closedLoopSessionStore", () => ({ saveClosedLoopSession: vi.fn() }));
vi.mock("./scientificEventJournal", () => ({ recordClosedLoopRun: vi.fn() }));
vi.mock("./scientificDatasetPersistence", () => ({ persistSimulationDataset: vi.fn() }));
vi.mock("./hardwareProfiles", () => ({ getHardwareEngineeringProfile: vi.fn() }));
vi.mock("./closedLoopSimulation", () => ({ ClosedLoopSimulationEngine: vi.fn() }));
vi.mock("./closedLoopWiring", () => ({
  getClosedLoopWiringReport: vi.fn(() => ({ status: "READY" })),
  inspectClosedLoopWiring: vi.fn(() => ({ status: "READY" })),
  mapExperimentInputsToEngine: vi.fn(),
}));

import { closedLoopRouter } from "./closedLoopRouter";

const sessionId = "session-ownership-001";
const experimentId = "experiment-owner-001";
const snapshot = { stepNumber: 1, elapsedSeconds: 1, paused: false, sensors: {}, state: {}, dynamics: {}, control: { operatorLimits: {} }, targets: {}, ultrasonic: {}, configuration: {}, frames: [], pausedSteps: [] };

function makeSession() {
  return { sessionId, experimentId, status: "created", createdAt: "2026-08-12T00:00:00.000Z", updatedAt: "2026-08-12T00:00:00.000Z", configuration: {}, engine: { getSnapshot: () => snapshot } };
}

describe("closed-loop simulation result ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runtime.getRuntimeSession.mockReturnValue(makeSession());
    runtime.getRuntimeSnapshot.mockReturnValue(snapshot);
    db.getExperiment.mockResolvedValue({ id: experimentId, userId: 101 });
  });

  it("allows the experiment owner to read the result", async () => {
    const caller = closedLoopRouter.createCaller({ user: { id: 101, role: "user" } } as never);
    await expect(caller.get(sessionId)).resolves.toMatchObject({ sessionId, experimentId });
    expect(db.getExperiment).toHaveBeenCalledWith(experimentId);
  });

  it("allows an admin to read the result when policy permits", async () => {
    const caller = closedLoopRouter.createCaller({ user: { id: 900, role: "admin" } } as never);
    await expect(caller.get(sessionId)).resolves.toMatchObject({ sessionId, experimentId });
  });

  it("rejects another authenticated user with FORBIDDEN", async () => {
    const caller = closedLoopRouter.createCaller({ user: { id: 202, role: "user" } } as never);
    await expect(caller.get(sessionId)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects an unauthenticated caller with UNAUTHORIZED", async () => {
    const caller = closedLoopRouter.createCaller({ user: null } as never);
    await expect(caller.get(sessionId)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(db.getExperiment).not.toHaveBeenCalled();
  });
});
