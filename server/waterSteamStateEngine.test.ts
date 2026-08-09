import { describe, expect, it } from "vitest";
import { resolveWaterSteamState } from "./waterSteamStateEngine";

describe("unified water steam state engine", () => {
  it("routes an ordinary liquid state without inventing properties", () => {
    const state = resolveWaterSteamState(300, 3);
    expect(state.region).toBe(1);
    expect(state.phase).toBe("LIQUID");
    expect(state.status).toBe("DATA_GAP");
    expect(state.properties).toEqual({});
    expect(state.provenance.standard).toBe("IAPWS_IF97");
  });

  it("routes a vapor state to Region 2", () => {
    const state = resolveWaterSteamState(700, 0.0035);
    expect(state.region).toBe(2);
    expect(state.phase).toBe("VAPOR");
    expect(state.status).toBe("DATA_GAP");
  });

  it("keeps property evaluation conservative until the authoritative adapter is promoted", () => {
    const state = resolveWaterSteamState(500, 3);
    expect(state.region).toBe(1);
    expect(state.properties).toEqual({});
    expect(state.notes.some((note) => note.includes("not silently approximated"))).toBe(true);
  });
});
