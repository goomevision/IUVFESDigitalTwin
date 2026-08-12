import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export interface RawDatasetObject {
  storageRef: string;
  sha256: string;
  byteLength: number;
}

export interface RawDatasetStore {
  putImmutable(datasetId: string, bytes: Buffer): Promise<RawDatasetObject>;
  getVerified(storageRef: string, expectedSha256: string): Promise<Buffer>;
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Content-addressed immutable backend used for local/dev and deterministic tests.
 * Production object storage must implement the same contract before this backend
 * is used for production scientific evidence.
 */
export class FilesystemRawDatasetStore implements RawDatasetStore {
  constructor(private readonly rootDirectory: string) {}

  public async putImmutable(datasetId: string, bytes: Buffer): Promise<RawDatasetObject> {
    const digest = sha256(bytes);
    const safeId = datasetId.replace(/[^a-zA-Z0-9._-]/g, "_");
    const directory = resolve(this.rootDirectory, safeId);
    const storageRef = join(directory, `${digest}.raw`);

    await mkdir(directory, { recursive: true });

    try {
      const existing = await readFile(storageRef);
      if (!existing.equals(bytes)) {
        throw new Error(`RAW_DATASET_HASH_COLLISION: ${storageRef}`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await writeFile(storageRef, bytes, { flag: "wx" });
    }

    const metadata = await stat(storageRef);
    if (metadata.size !== bytes.byteLength) {
      throw new Error(`RAW_DATASET_SIZE_MISMATCH: ${storageRef}`);
    }

    return { storageRef, sha256: digest, byteLength: metadata.size };
  }

  public async getVerified(storageRef: string, expectedSha256: string): Promise<Buffer> {
    const bytes = await readFile(storageRef);
    const actual = sha256(bytes);
    if (actual !== expectedSha256) {
      throw new Error(`RAW_DATASET_CHECKSUM_MISMATCH: expected ${expectedSha256}, got ${actual}`);
    }
    return bytes;
  }
}
