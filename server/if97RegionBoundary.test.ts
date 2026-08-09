import { describe, expect, it } from "vitest";
import { if97B23Pressure, if97Region23BoundaryTemperature } from "./if97RegionBoundary";

describe("IAPWS IF97 B23 boundary", () => {
  it("matches the published verification point", () => {
    const result = if97B23Pressure(623.15);
    expect(result.status).toBe("SUPPORTED");
    expect(result.pressureMPa).toBeCloseTo(16.5291643, 6);
  });

  it("rejects temperatures outside the B23 validity range", () => {
    expect(if97B23Pressure(600).status).toBe("OUT_OF_DOMAIN");
    expect(if97B23Pressure(900).status).toBe("OUT_OF_DOMAIN");
  });

  it("inverts the published boundary consistently", () => {
    const result = if97Region23BoundaryTemperature(16.5291643);
    expect(result.status).toBe("SUPPORTED");
    expect(result.temperatureK).toBeCloseTo(623.15, 5);
  });
});
