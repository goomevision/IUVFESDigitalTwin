import { describe, expect, it } from "vitest";
import { S3RawDatasetStore } from "./s3RawDatasetStore";

class FakeS3Client {
  private readonly objects = new Map<string, { bytes: Buffer; metadata: Record<string, string> }>();

  async send(command: { input: { Bucket?: string; Key?: string; Body?: Buffer; Metadata?: Record<string, string> }; constructor: unknown }) {
    const input = command.input;
    const key = `${input.Bucket}/${input.Key}`;
    const name = (command.constructor as { name: string }).name;
    if (name === "GetObjectCommand") {
      const object = this.objects.get(key);
      if (!object) throw new Error("NoSuchKey");
      return { Body: { transformToByteArray: async () => new Uint8Array(object.bytes) } };
    }
    if (name === "PutObjectCommand") {
      if (this.objects.has(key)) throw new Error("PreconditionFailed");
      this.objects.set(key, { bytes: Buffer.from(input.Body ?? []), metadata: { ...(input.Metadata ?? {}) } });
      return {};
    }
    if (name === "HeadObjectCommand") {
      const object = this.objects.get(key);
      if (!object) throw new Error("NotFound");
      return { ContentLength: object.bytes.byteLength, Metadata: object.metadata };
    }
    throw new Error(`Unsupported command ${name}`);
  }
}

describe("S3RawDatasetStore", () => {
  it("uses content-addressed immutable storage and verifies retrieval", async () => {
    const client = new FakeS3Client();
    const store = new S3RawDatasetStore(client as never, "iuvfes-test");
    const bytes = Buffer.from("raw experimental observation\n", "utf8");

    const object = await store.putImmutable("experiment-1", bytes);
    expect(object.storageRef).toMatch(/^s3:\/\/iuvfes-test\/raw\/experiment-1\/[a-f0-9]{64}\.raw$/);
    await expect(store.getVerified(object.storageRef, object.sha256)).resolves.toEqual(bytes);
  });

  it("rejects a checksum mismatch on retrieval", async () => {
    const client = new FakeS3Client();
    const store = new S3RawDatasetStore(client as never, "iuvfes-test");
    const object = await store.putImmutable("experiment-2", Buffer.from("original", "utf8"));

    await expect(store.getVerified(object.storageRef, "0".repeat(64))).rejects.toThrow("RAW_DATASET_CHECKSUM_MISMATCH");
  });
});
