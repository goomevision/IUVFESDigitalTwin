import { describe, expect, it } from "vitest";
import { buildCausalEvents, canonicalize, hashEvent } from "./scientificEventJournal";
import type { ClosedLoopResult } from "./closedLoopSimulation";

describe("scientific event journal", () => {
  it("canonicalizes object keys deterministically", () => {
    expect(canonicalize({ b: 2, a: 1 })).toBe(canonicalize({ a: 1, b: 2 }));
  });

  it("changes the hash when the payload changes", () => {
    const base = {
      experimentId: "exp-1",
      sequence: 1,
      eventType: "CAUSAL_STEP",
      occurredAt: new Date("2026-08-09T00:00:01.000Z"),
      source: "test",
      stage: "HEAT_UP",
      payload: { temperatureC: 60 },
      previousHash: null,
    };
    const first = hashEvent(base);
    const second = hashEvent({ ...base, payload: { temperatureC: 61 } });
    expect(first).not.toBe(second);
    expect(first).toHaveLength(64);
  });

  it("builds a contiguous hash chain for every causal frame", () => {
    const result: ClosedLoopResult = {
      status: "COMPLETE",
      frames: [
        {
          step: 1,
          timestampSeconds: 1,
          sensorBefore: { chamberSealed: true, pressureMbar: 1000, temperatureC: 25, yieldPercent: 0, waterRemovedKg: 0, oilRecoveredKg: 0, energyKwh: 0 },
          controller: { stage: "PRE_FLIGHT", commands: {}, interlock: "SAFE" } as any,
          sensorAfter: { chamberSealed: true, pressureMbar: 900, temperatureC: 26, yieldPercent: 0, waterRemovedKg: 0, oilRecoveredKg: 0, energyKwh: 0 },
          paused: false,
        },
        {
          step: 2,
          timestampSeconds: 2,
          sensorBefore: { chamberSealed: true, pressureMbar: 900, temperatureC: 26, yieldPercent: 0, waterRemovedKg: 0, oilRecoveredKg: 0, energyKwh: 0 },
          controller: { stage: "VACUUM", commands: {}, interlock: "SAFE" } as any,
          sensorAfter: { chamberSealed: true, pressureMbar: 800, temperatureC: 27, yieldPercent: 0, waterRemovedKg: 0, oilRecoveredKg: 0, energyKwh: 0 },
          paused: false,
        },
      ],
      finalSensors: { chamberSealed: true, pressureMbar: 800, temperatureC: 27, yieldPercent: 0, waterRemovedKg: 0, oilRecoveredKg: 0, energyKwh: 0 },
      pausedSteps: [],
    };

    const events = buildCausalEvents("exp-1", result, "test");
    expect(events).toHaveLength(3);
    expect(events[0].previousHash).toBeNull();
    expect(events[1].previousHash).toBe(events[0].eventHash);
    expect(events[2].previousHash).toBe(events[1].eventHash);
    expect(new Set(events.map((event) => event.eventHash)).size).toBe(3);
  });
});
