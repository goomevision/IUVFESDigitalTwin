import { describe, expect, it } from "vitest";
import { resolveIapwsWaterState } from "./iapwsPropertyAdapter";

describe("IAPWS property adapter", () => {
  it("uses absolute temperature and pressure", () => {
    const result = resolveIapwsWaterState({ temperatureK: 373.15, pressureMPa: 0.101325 });
    expect(result.source).toBe("IAPWS_IF97");
    expect(result.status).toBe("DATA_GAP");
    expect(result.properties).toEqual({});
  });

  it("rejects non-positive pressure", () => {
    const result = resolveIapwsWaterState({ temperatureK: 373.15, pressureMPa: 0 });
    expect(result.status).toBe("DATA_GAP");
    expect(result.phase).toBe("UNKNOWN");
  });

  it("does not substitute an approximate model", () => {
    const result = resolveIapwsWaterState({ temperatureK: 423.15, pressureMPa: 0.101325 });
    expect(result.status).toBe("DATA_GAP");
    expect(result.properties).toEqual({});
    expect(result.notes.join(" ")).toContain("verified IF97 region implementation");
  });
});
