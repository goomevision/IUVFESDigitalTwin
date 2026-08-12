import { describe, expect, it } from "vitest";
import { ClosedLoopSimulationEngine, type CausalFrame } from "./closedLoopSimulation";
import { FilesystemRawDatasetStore } from "./scientificRawDatasetStore";
import { persistSimulationRawDataset, serializeSimulationFrames } from "./scientificSimulationRawDataset";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

function makeFrames(): CausalFrame[] {
  const engine = new ClosedLoopSimulationEngine({ targetPressureMbar: 10, targetTemperatureC: 80, materialWeightKg: 1, waterContentPercent: 10, oilContentPercent: 5, maxSteps: 3 });
  engine.resume();
  const frames: CausalFrame[] = [];
  for (let i = 0; i < 3; i += 1) {
    const frame = engine.step();
    if (frame) frames.push(frame);
  }
  return frames;
}

describe("scientificSimulationRawDataset", () => {
  it("serializes the same frames deterministically", () => {
    const frames = makeFrames();
    expect(serializeSimulationFrames(frames).equals(serializeSimulationFrames(frames))).toBe(true);
  });

  it("persists the complete frame set and binds the manifest to the exact object", async () => {
    const root = await mkdtemp(join(tmpdir(), "iuvfes-raw-"));
    try {
      const store = new FilesystemRawDatasetStore(root);
      const frames = makeFrames();
      const result = await persistSimulationRawDataset({ experimentId: "exp-raw-1", frames, store, provenanceRefs: ["run:exp-raw-1", "simulation:closed-loop"] });
      expect(result.manifest.origin).toBe("SIMULATION");
      expect(result.manifest.qualityStatus).toBe("RAW");
      expect(result.manifest.frameCount).toBe(frames.length);
      expect(result.manifest.firstStep).toBe(frames[0].step);
      expect(result.manifest.lastStep).toBe(frames.at(-1)?.step);
      expect(result.manifest.sha256).toBe(result.object.sha256);
      expect(result.manifest.storageRef).toBe(result.object.storageRef);
      await expect(store.getVerified(result.manifest.storageRef, result.manifest.sha256)).resolves.toEqual(result.bytes);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects an empty completed-run package", async () => {
    const root = await mkdtemp(join(tmpdir(), "iuvfes-raw-empty-"));
    try {
      const store = new FilesystemRawDatasetStore(root);
      await expect(persistSimulationRawDataset({ experimentId: "exp-empty", frames: [], store })).rejects.toThrow("RAW_DATASET_EMPTY_SIMULATION");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
