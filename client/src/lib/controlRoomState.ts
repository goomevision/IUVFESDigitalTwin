export const CONTROL_ROOM_STATES = [
  "LOADING",
  "READY",
  "RUNNING",
  "PAUSED",
  "STOPPED",
  "COMPLETE",
  "FAULT",
  "UNKNOWN",
  "NO_DATA",
  "SESSION_EXPIRED",
  "API_UNAVAILABLE",
  "SAFETY_INTERLOCK",
  "UNSUPPORTED_LEGACY_DATA",
  "REPLAY",
] as const;

export type ControlRoomState = (typeof CONTROL_ROOM_STATES)[number];

export type ScientificDisplayStatus =
  | "AVAILABLE"
  | "UNKNOWN"
  | "NOT_AVAILABLE"
  | "INVALID"
  | "UNVERIFIED"
  | "ESTIMATED"
  | "SIMULATION"
  | "LITERATURE"
  | "LABORATORY";

export function scientificDisplayValue(
  value: unknown,
  digits = 2,
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "UNKNOWN";
  }
  return value.toFixed(digits);
}

export function mapSessionState(input: {
  loading?: boolean;
  status?: string | null;
  hasFrame?: boolean;
  replay?: boolean;
  apiUnavailable?: boolean;
}): ControlRoomState {
  if (input.loading) return "LOADING";
  if (input.apiUnavailable) return "API_UNAVAILABLE";
  if (input.replay) return "REPLAY";
  if (!input.hasFrame && !input.status) return "NO_DATA";

  switch (input.status?.toLowerCase()) {
    case "running":
      return "RUNNING";
    case "paused":
      return "PAUSED";
    case "stopped":
      return "STOPPED";
    case "completed":
    case "complete":
      return "COMPLETE";
    case "fault":
      return "FAULT";
    case "ready":
      return "READY";
    default:
      return input.hasFrame ? "UNKNOWN" : "NO_DATA";
  }
}

export function hasScientificData(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value);
}
