import { describe, expect, it } from "vitest";
import { resolveWaterSteamState } from "./waterSteamStateEngine";

describe("unified water steam state engine", () => {
  it("returns Region 1 liquid properties", () => {
    const state = resolveWaterSteamState(300, 3);
    expect(state.region).toBe(1);
    expect(state.phase).toBe("LIQUID");
    expect(state.status).toBe("READY_FOR_SIMULATION");
    expect(state.properties.enthalpyKJPerKg).toBeCloseTo(115.331273, 4);
    expect(state.properties.specificVolumeM3PerKg).toBeCloseTo(0.00100215168, 8);
  });

  it("returns Region 2 vapor properties", () => {
    const state = resolveWaterSteamState(700, 0.0035);
    expect(state.region).toBe(2);
    expect(state.phase).toBe("VAPOR");
    expect(state.status).toBe("READY_FOR_SIMULATION");
    expect(state.properties.enthalpyKJPerKg).toBeCloseTo(3335.68375, 4);
    // At 700 K and 0.0035 MPa, 92.3015898 m3/kg is the consistent IF97 value.
    expect(state.properties.specificVolumeM3PerKg).toBeCloseTo(92.3015898174, 5);
  });

  it("does not invent two-phase mixture properties", () => {
    const state = resolveWaterSteamState(373.15, 0.101325);
    expect(state.region).toBe(4);
    expect(state.phase).toBe("TWO_PHASE");
    expect(state.status).toBe("DATA_GAP");
    expect(state.properties.saturationPressureMPa).toBeCloseTo(0.1014179779, 8);
  });

  it("does not expose Region 3 as a fake property solution", () => {
    const state = resolveWaterSteamState(650, 25);
    expect(state.region).toBe(3);
    expect(state.status).toBe("DATA_GAP");
    expect(state.properties).toEqual({});
  });
});
