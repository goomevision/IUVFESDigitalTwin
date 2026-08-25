import {
  clearControlRoomEventsForTest,
  getControlRoomEvents,
  recordControlRoomEvent,
  redactObservabilityValue,
  subscribeControlRoomEvents,
  toFrameReference,
} from "../client/src/lib/controlRoomObservability";
import { beforeEach, describe, expect, it } from "vitest";

describe("P13 Control Room observability", () => {
  beforeEach(() => clearControlRoomEventsForTest());

  it("redacts credential-shaped fields recursively", () => {
    expect(redactObservabilityValue({
      authorization: "Bearer secret-value",
      detail: { cookie: "session=secret", safe: "VISIBLE" },
      tokenLabel: "not-a-token-value",
    })).toEqual({
      authorization: "REDACTED",
      detail: { cookie: "REDACTED", safe: "VISIBLE" },
      tokenLabel: "REDACTED",
    });
  });

  it("records an operator action as a browser-local operational event", () => {
    const event = recordControlRoomEvent({
      event: "PAUSE",
      result: "SUCCESS",
      experimentId: "existing-experiment",
      sessionId: "existing-session",
      operator: { id: 7, role: "admin", label: "Operator" },
      detail: { control: "pause", oauthCode: "must-not-leak" },
    });

    expect(event.event).toBe("PAUSE");
    expect(event.result).toBe("SUCCESS");
    expect(event.experimentId).toBe("existing-experiment");
    expect(event.sessionId).toBe("existing-session");
    expect(event.detail).toEqual({ control: "pause", oauthCode: "REDACTED" });
    expect(getControlRoomEvents()).toHaveLength(1);
  });

  it("references an existing frame by step and simulation timestamp only", () => {
    const frameRef = toFrameReference({ step: 18, timestampSeconds: 36 });
    const event = recordControlRoomEvent({ event: "FRAME_RENDERED", result: "INFO", frameRef });

    expect(frameRef).toEqual({ step: 18, timestampSeconds: 36, provenance: "SIMULATION" });
    expect(event.frameRef).toEqual(frameRef);
    expect(event).not.toHaveProperty("sensorAfter");
    expect(event).not.toHaveProperty("actuatorLevels");
  });

  it("notifies listeners without persisting or exporting events", () => {
    const observed: number[] = [];
    const unsubscribe = subscribeControlRoomEvents(next => observed.push(next.length));
    recordControlRoomEvent({ event: "RUNTIME_INIT", result: "INFO" });
    unsubscribe();
    recordControlRoomEvent({ event: "THREE_DISPOSE", result: "SUCCESS" });

    expect(observed).toEqual([0, 1]);
    expect(getControlRoomEvents()).toHaveLength(2);
  });
});
