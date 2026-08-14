import { describe, expect, it } from "vitest";
import {
  hasScientificData,
  mapSessionState,
  scientificDisplayValue,
} from "./controlRoomState";

describe("control room state contract", () => {
  it("keeps missing scientific values UNKNOWN", () => {
    expect(scientificDisplayValue(undefined)).toBe("UNKNOWN");
    expect(scientificDisplayValue(null)).toBe("UNKNOWN");
    expect(scientificDisplayValue(Number.NaN)).toBe("UNKNOWN");
    expect(scientificDisplayValue(Number.POSITIVE_INFINITY)).toBe("UNKNOWN");
  });

  it("formats real numeric values without inventing a fallback", () => {
    expect(scientificDisplayValue(12.3456)).toBe("12.35");
    expect(scientificDisplayValue(12.3456, 1)).toBe("12.3");
  });

  it("maps authoritative runtime states without creating local scientific state", () => {
    expect(mapSessionState({ loading: true })).toBe("LOADING");
    expect(mapSessionState({ status: "running", hasFrame: true })).toBe("RUNNING");
    expect(mapSessionState({ status: "paused", hasFrame: true })).toBe("PAUSED");
    expect(mapSessionState({ status: "completed", hasFrame: true })).toBe("COMPLETE");
    expect(mapSessionState({ status: "fault", hasFrame: true })).toBe("FAULT");
    expect(mapSessionState({ apiUnavailable: true })).toBe("API_UNAVAILABLE");
    expect(mapSessionState({ replay: true, hasFrame: true })).toBe("REPLAY");
    expect(mapSessionState({})).toBe("NO_DATA");
  });

  it("recognizes only finite numbers as available scientific data", () => {
    expect(hasScientificData(1)).toBe(true);
    expect(hasScientificData(0)).toBe(true);
    expect(hasScientificData(undefined)).toBe(false);
    expect(hasScientificData(Number.NaN)).toBe(false);
    expect(hasScientificData(Infinity)).toBe(false);
  });
});
