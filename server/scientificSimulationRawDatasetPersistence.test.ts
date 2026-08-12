import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClosedLoopSimulationEngine } from "./closedLoopSimulation";
import { FilesystemRawDatasetStore } from "./scientificRawDatasetStore";
import { persistCompletedSimulationRawDataset } from "./scientificSimulationRawDatasetPersistence";

const execute = vi.fn(async () => ({}));
vi.mock("./db", () => ({ getDb: vi.fn(async () => ({ execute })) }));

describe("completed simulation raw dataset integration", () => {
  beforeEach(() => execute.mockClear());

  it("persists the exact completed frame set and writes manifest plus provenance", async () => {
    const engine = new ClosedLoopSimulationEngine({
      targetPressureMbar: 80,
      targetTemperatureC: 55,
      materialWeightKg: 10,
      waterContentPercent: 65,
      oilContentPercent: 3,
      dtSeconds: 1,
      maxSteps: 1,
    });
    engine.resume();
    engine.step();
    const frames = engine.getFrames();
    expect(frames).toHaveLength(1);

    const store = new FilesystemRawDatasetStore(`/tmp/iuvfes-p0-${Date.now()}`);
    const result = await persistCompletedSimulationRawDataset({
      experimentId: "exp-complete",
      frames,
      store,
      provenanceRefs: ["event-hash-1"],
    });

    expect(result.manifest.origin).toBe("SIMULATION");
    expect(result.manifest.qualityStatus).toBe("RAW");
    expect(result.manifest.frameCount).toBe(1);
    expect(result.manifest.provenanceRefs).toEqual(expect.arrayContaining(["event-hash-1"]));
    expect(result.manifest.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(execute).toHaveBeenCalledTimes(2);
  });
});
