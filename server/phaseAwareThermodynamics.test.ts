import { describe, expect, it } from "vitest";
import { classifyWaterPhase } from "./phaseAwareThermodynamics";

describe("phase-aware thermodynamics boundary", () => {
  it("does not guess water phase without authoritative saturation data", () => {
    const result = classifyWaterPhase({ temperatureC: 100, absolutePressureKPa: 101.325 });
    expect(result.status).toBe("DATA_GAP");
    expect(result.phase).toBe("UNKNOWN");
  });

  it("rejects invalid absolute pressure", () => {
    const result = classifyWaterPhase({ temperatureC: 80, absolutePressureKPa: 0 });
    expect(result.status).toBe("DATA_GAP");
    expect(result.phase).toBe("UNKNOWN");
  });
});
