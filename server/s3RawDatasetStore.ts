import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import type { RawDatasetObject, RawDatasetStore } from "./scientificRawDatasetStore";

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function bodyToBuffer(body: unknown): Promise<Buffer> {
  if (!body || typeof body !== "object" || !("transformToByteArray" in body)) {
    throw new Error("RAW_DATASET_INVALID_OBJECT_BODY");
  }
  const transform = (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray;
  return Buffer.from(await transform());
}

/**
 * Content-addressed S3-compatible backend. Keys are derived from SHA-256, so a
 * completed object is immutable by construction; retrieval always re-hashes the
 * exact bytes returned by the object store before exposing them to callers.
 */
export class S3RawDatasetStore implements RawDatasetStore {
  constructor(private readonly client: S3Client, private readonly bucket: string) {}

  public async putImmutable(datasetId: string, bytes: Buffer): Promise<RawDatasetObject> {
    const digest = sha256(bytes);
    const key = `raw/${datasetId.replace(/[^a-zA-Z0-9._-]/g, "_")}/${digest}.raw`;
    const storageRef = `s3://${this.bucket}/${key}`;

    try {
      const existing = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      const existingBytes = await bodyToBuffer(existing.Body);
      if (sha256(existingBytes) !== digest || !existingBytes.equals(bytes)) {
        throw new Error(`RAW_DATASET_IMMUTABILITY_VIOLATION: ${storageRef}`);
      }
      return { storageRef, sha256: digest, byteLength: existingBytes.byteLength };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("RAW_DATASET_IMMUTABILITY_VIOLATION")) throw error;
    }

    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: bytes,
      ContentType: "application/octet-stream",
      Metadata: { sha256: digest, datasetId },
      IfNoneMatch: "*",
    }));

    const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
    if (head.ContentLength !== bytes.byteLength || head.Metadata?.sha256 !== digest) {
      throw new Error(`RAW_DATASET_PERSISTENCE_VERIFICATION_FAILED: ${storageRef}`);
    }
    return { storageRef, sha256: digest, byteLength: bytes.byteLength };
  }

  public async getVerified(storageRef: string, expectedSha256: string): Promise<Buffer> {
    const prefix = `s3://${this.bucket}/`;
    if (!storageRef.startsWith(prefix)) throw new Error("RAW_DATASET_STORAGE_REF_MISMATCH");
    const key = storageRef.slice(prefix.length);
    const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const bytes = await bodyToBuffer(response.Body);
    const actual = sha256(bytes);
    if (actual !== expectedSha256) {
      throw new Error(`RAW_DATASET_CHECKSUM_MISMATCH: expected ${expectedSha256}, got ${actual}`);
    }
    return bytes;
  }
}
