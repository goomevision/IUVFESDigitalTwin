export type ControlRoomEventName =
  | "AUTH_ATTEMPT"
  | "AUTH_SUCCESS"
  | "AUTH_FAILURE"
  | "AUTH_LOGOUT"
  | "AUTH_SESSION_EXPIRED"
  | "EXPERIMENT_OPEN"
  | "SESSION_RECOVER"
  | "SESSION_RECOVERED"
  | "SESSION_ERROR"
  | "CONTROL_ROOM_OPEN"
  | "PLAY"
  | "PAUSE"
  | "RESUME"
  | "STOP"
  | "RESET"
  | "SAVE"
  | "CONTROL_APPLY"
  | "RUNTIME_INIT"
  | "REACT_ERROR"
  | "WEBGL_ERROR"
  | "DOM_ERROR"
  | "FRAME_RECEIVED"
  | "FRAME_RENDERED"
  | "THREE_SCENE_INIT"
  | "THREE_RENDERER_INIT"
  | "THREE_DISPOSE"
  | "SELECT_COMPONENT"
  | "FOCUS_COMPONENT"
  | "CAMERA_PRESET"
  | "ZOOM"
  | "RESET_VIEW"
  | "LAYER_CHANGE"
  | "VIEW_MODE_CHANGE"
  | "REPLAY_OPEN";

export type ControlRoomEventResult = "SUCCESS" | "FAILURE" | "BLOCKED" | "INFO" | "ERROR";

export type OperatorReference = {
  id?: number;
  role?: string;
  label?: string;
};

export type FrameReference = {
  step?: number;
  timestampSeconds?: number;
  provenance: "SIMULATION" | "UNKNOWN";
};

export type ControlRoomObservabilityEvent = {
  id: string;
  event: ControlRoomEventName;
  occurredAt: string;
  result: ControlRoomEventResult;
  deployment: { origin: string; path: string };
  operator?: OperatorReference;
  experimentId?: string;
  sessionId?: string;
  componentId?: string;
  frameRef?: FrameReference;
  detail?: Record<string, unknown>;
};

type RecordInput = Omit<ControlRoomObservabilityEvent, "id" | "occurredAt" | "deployment"> & {
  occurredAt?: string;
  deployment?: ControlRoomObservabilityEvent["deployment"];
};

const MAX_EVENTS = 200;
const SENSITIVE_KEY = /(authorization|cookie|code|password|secret|token|credential)/i;
let events: ControlRoomObservabilityEvent[] = [];
const listeners = new Set<(next: readonly ControlRoomObservabilityEvent[]) => void>();

function browserDeployment(): ControlRoomObservabilityEvent["deployment"] {
  if (typeof window === "undefined") return { origin: "UNKNOWN", path: "UNKNOWN" };
  return { origin: window.location.origin, path: window.location.pathname };
}

function randomEventId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `event-${Date.now()}-${events.length}`;
}

export function redactObservabilityValue(value: unknown, key = ""): unknown {
  if (SENSITIVE_KEY.test(key)) return "REDACTED";
  if (Array.isArray(value)) return value.map(item => redactObservabilityValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [entryKey, redactObservabilityValue(entryValue, entryKey)]),
    );
  }
  if (typeof value === "string" && /bearer\s+|oauth|jwt/i.test(value)) return "REDACTED";
  return value;
}

export function toOperatorReference(user: unknown): OperatorReference | undefined {
  if (!user || typeof user !== "object") return undefined;
  const candidate = user as { id?: unknown; role?: unknown; name?: unknown };
  return {
    id: typeof candidate.id === "number" ? candidate.id : undefined,
    role: typeof candidate.role === "string" ? candidate.role : undefined,
    label: typeof candidate.name === "string" ? candidate.name.slice(0, 96) : undefined,
  };
}

export function toFrameReference(frame: unknown): FrameReference | undefined {
  if (!frame || typeof frame !== "object") return undefined;
  const candidate = frame as { step?: unknown; timestampSeconds?: unknown };
  const step = typeof candidate.step === "number" && Number.isFinite(candidate.step) ? candidate.step : undefined;
  const timestampSeconds = typeof candidate.timestampSeconds === "number" && Number.isFinite(candidate.timestampSeconds)
    ? candidate.timestampSeconds
    : undefined;
  if (step === undefined && timestampSeconds === undefined) return undefined;
  return { step, timestampSeconds, provenance: "SIMULATION" };
}

export function recordControlRoomEvent(input: RecordInput): ControlRoomObservabilityEvent {
  const event: ControlRoomObservabilityEvent = {
    id: randomEventId(),
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    deployment: input.deployment ?? browserDeployment(),
    ...input,
    detail: input.detail ? redactObservabilityValue(input.detail) as Record<string, unknown> : undefined,
  };
  events = [...events.slice(-(MAX_EVENTS - 1)), event];
  listeners.forEach(listener => listener(events));
  return event;
}

export function getControlRoomEvents(): readonly ControlRoomObservabilityEvent[] {
  return events;
}

export function subscribeControlRoomEvents(listener: (next: readonly ControlRoomObservabilityEvent[]) => void) {
  listeners.add(listener);
  listener(events);
  return () => { listeners.delete(listener); };
}

export function clearControlRoomEventsForTest() {
  events = [];
  listeners.forEach(listener => listener(events));
}

export function installRuntimeObservability() {
  if (typeof window === "undefined") return;
  const marker = "__iuvfesRuntimeObservabilityInstalled" as const;
  if ((window as typeof window & { [marker]?: boolean })[marker]) return;
  (window as typeof window & { [marker]?: boolean })[marker] = true;
  recordControlRoomEvent({ event: "RUNTIME_INIT", result: "INFO" });
  window.addEventListener("error", event => {
    const message = event.error instanceof Error ? event.error.message : event.message;
    const name = event.error instanceof Error ? event.error.name : undefined;
    recordControlRoomEvent({
      event: /removeChild|insertBefore|NotFoundError/i.test(String(message)) ? "DOM_ERROR" : "REACT_ERROR",
      result: "ERROR",
      detail: { name, message: String(message).slice(0, 500) },
    });
  });
  window.addEventListener("unhandledrejection", event => {
    const reason = event.reason instanceof Error ? { name: event.reason.name, message: event.reason.message } : { message: String(event.reason) };
    recordControlRoomEvent({ event: "REACT_ERROR", result: "ERROR", detail: reason });
  });
}
