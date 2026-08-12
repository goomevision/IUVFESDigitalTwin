import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FilesystemRawDatasetStore } from "./scientificRawDatasetStore";

async function tempStore() {
  return mkdtemp(join(tmpdir(), "iuvfes-raw-"));
}

describe("FilesystemRawDatasetStore", () => {
  it("persists exact bytes and returns their SHA-256", async () => {
    const root = await tempStore();
    try {
      const store = new FilesystemRawDatasetStore(root);
      const bytes = Buffer.from('{"origin":"EXPERIMENTAL","value":42}\n', "utf8");
      const object = await store.putImmutable("experiment-1", bytes);

      expect(object.byteLength).toBe(bytes.byteLength);
      expect(object.sha256).toMatch(/^[a-f0-9]{64}$/);
      await expect(store.getVerified(object.storageRef, object.sha256)).resolves.toEqual(bytes);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects retrieval when persisted bytes no longer match the manifest checksum", async () => {
    const root = await tempStore();
    try {
      const store = new FilesystemRawDatasetStore(root);
      const object = await store.putImmutable("experiment-2", Buffer.from("original", "utf8"));
      await writeFile(object.storageRef, Buffer.from("tampered", "utf8"));

      await expect(store.getVerified(object.storageRef, object.sha256)).rejects.toThrow("RAW_DATASET_CHECKSUM_MISMATCH");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("does not silently overwrite an immutable object", async () => {
    const root = await tempStore();
    try {
      const store = new FilesystemRawDatasetStore(root);
      const first = await store.putImmutable("experiment-3", Buffer.from("first", "utf8"));
      const second = await store.putImmutable("experiment-3", Buffer.from("first", "utf8"));
      expect(second.storageRef).toBe(first.storageRef);
      await expect(store.putImmutable("experiment-3", Buffer.from("second", "utf8"))).resolves.toBeDefined();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
