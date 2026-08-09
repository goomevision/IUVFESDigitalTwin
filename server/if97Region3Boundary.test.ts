import { describe, expect, it } from "vitest";
import { classifyRegion3Boundary } from "./if97Region3Boundary";

describe("IF97 Region 3 boundary gate", () => {
  it("recognizes a dense-fluid Region 3 candidate", () => {
    const result = classifyRegion3Boundary(650, 25);
    expect(result.status).toBe("SUPPORTED");
    expect(result.region).toBe(3);
    expect(result.notes.join(" ")).toContain("DATA_GAP");
  });

  it("rejects ordinary low-pressure vapor states", () => {
    const result = classifyRegion3Boundary(700, 0.1);
    expect(result.status).toBe("OUT_OF_DOMAIN");
    expect(result.region).toBeNull();
  });

  it("rejects states below the conservative Region 3 temperature boundary", () => {
    const result = classifyRegion3Boundary(600, 25);
    expect(result.status).toBe("OUT_OF_DOMAIN");
  });
});
