# P13 — Log-First Control Room Observability Contract

**Status:** Approved implementation boundary for P13. This document does not alter the scientific engine, database schema, CausalFrame contract, or P10 runtime status.

## Purpose

P13 adds an operator and technical observability layer around the existing Control Room lifecycle. It records **who attempted an action, what UI/runtime lifecycle event occurred, and references to authoritative engine state where already available**. It does not create measurements, telemetry, physics values, actuator values, CausalFrames, experiments, sessions, or scientific conclusions.

> Scientific truth remains the existing `ClosedLoopSimulationEngine → CausalFrame → session → recorder/evidence` path. Observability events are operational metadata, not scientific evidence.

## Focused Read Map

| File | Reason | Relationship to P13 |
|---|---|---|
| `client/src/main.tsx` | Configures tRPC, unauthorized redirects, and browser API errors. | Provides the global entry point for technical error observation and login initiation. |
| `client/src/const.ts` | Builds the OAuth login navigation. | Authentication attempts must be observable without logging state cookies, authorization codes, or tokens. |
| `client/src/_core/hooks/useAuth.ts` | Queries `auth.me` and exposes the operator identity. | Defines `AUTH_SUCCESS`, `AUTH_FAILURE`, `AUTH_LOGOUT`, and the `NOT AUTHENTICATED` gate. |
| `client/src/pages/ScientificExperimentFlow.tsx` | Selects Intake or `ProcessSimulator`. | Is the correct gate before experiment selection and Control Room rendering. |
| `client/src/components/ProcessSimulator.tsx` | Orchestrates experiment lookup, canonical-session recovery, lifecycle controls, frames, and recorder. | Owns `EXPERIMENT_OPEN`, `SESSION_RECOVER`, `CONTROL_ROOM_OPEN`, lifecycle actions, and CausalFrame references. |
| `client/src/components/ProcessMachine3D.tsx` | Renders Three.js lifecycle and non-engine UI interactions. | Emits technical and interaction events only; it remains a CausalFrame consumer. |
| `server/closedLoopRouter.ts` | Authoritative protected session lifecycle and persisted recovery. | Already records server-side lifecycle/control records; no new scientific/session procedure is needed for P13. |
| `server/db.ts` and `drizzle/schema.ts` | Existing `controlLogs` persistence. | Existing records are experiment-bound lifecycle/control history, not a replacement for auth/UI/runtime observability. No schema change is planned. |
| `server/scientificEventJournal.ts` | Immutable causal/provenance event chain. | Must remain separate from P13; it is scientific/event evidence and may contain frame payloads. |
| `client/src/components/ErrorBoundary.tsx` | Existing React failure boundary. | P13 may observe classified technical failures but must not suppress, restyle away, or fabricate recovery from them. |
| `server/causalFrameVisualSync.test.ts` | Existing frame-time/visual authority regression. | Guards `timestampSeconds`, `effectiveCommands`, and `actuatorLevels` against P13 drift. |

## Authentication Gate

```text
Application
  → auth.me
  → authenticated operator identity
  → experiment selection
  → persisted canonical session recovery
  → Control Room
  → 3D visual consumer
```

When `auth.me` is `null`, the experiment intake and Control Room are not operator-ready. The UI must show **NOT AUTHENTICATED**, retain the P10 OAuth blocker honestly, and must not create an experiment, a session, telemetry, or a fallback identity.

P13 does not repair the separately audited GitHub Pages OAuth callback architecture. The known callback/deployment blocker therefore remains **AUTH BLOCKED** until its dedicated authentication work is approved and verified.

## Event Contract

All P13 events are in-memory, browser-local operational records. They are intentionally not persisted as scientific results and are not sent to a new endpoint.

| Field | Meaning | Constraint |
|---|---|---|
| `event` | Enumerated auth, operator, runtime, or frame-reference event. | Never a scientific measurement. |
| `occurredAt` | Browser operational timestamp. | Never displayed or used as simulation time. |
| `result` | `SUCCESS`, `FAILURE`, `BLOCKED`, `INFO`, or `ERROR`. | Describes the operation, not process quality. |
| `operator` | Existing authenticated identity reference when available. | Omit when unauthenticated; never log password, token, cookie, or OAuth code. |
| `deployment` | Browser origin and route identity. | No credentials or configuration secret. |
| `experimentId`, `sessionId`, `componentId` | Existing references when available. | No generated IDs. |
| `frameRef` | `step`, `timestampSeconds`, and provenance label of an existing frame. | Never copies the CausalFrame payload or creates a frame. |
| `detail` | Whitelisted, redacted technical/action context. | Sensitive-key values are always replaced with `REDACTED`. |

### Approved Event Families

| Family | Events |
|---|---|
| Authentication | `AUTH_ATTEMPT`, `AUTH_SUCCESS`, `AUTH_FAILURE`, `AUTH_LOGOUT`, `AUTH_SESSION_EXPIRED` |
| Control Room/operator | `EXPERIMENT_OPEN`, `SESSION_RECOVER`, `CONTROL_ROOM_OPEN`, `SAVE`, `PLAY`, `PAUSE`, `RESUME`, `STOP`, `RESET`, `SELECT_COMPONENT`, `FOCUS_COMPONENT`, `CAMERA_PRESET`, `ZOOM`, `RESET_VIEW`, `LAYER_CHANGE`, `VIEW_MODE_CHANGE`, `REPLAY_OPEN` |
| Runtime | `RUNTIME_INIT`, `THREE_SCENE_INIT`, `THREE_RENDERER_INIT`, `THREE_DISPOSE`, `SESSION_RECOVERED`, `SESSION_ERROR`, `WEBGL_ERROR`, `DOM_ERROR`, `REACT_ERROR` |
| CausalFrame reference | `FRAME_RECEIVED`, `FRAME_RENDERED` |

## Scientific Boundary

1. `frame.timestampSeconds` remains the only simulation-time source.
2. `frame.actuatorLevels` remains the continuous actuator visual source; `effectiveCommands` remains command/interlock authority.
3. Logging may refer to an already received frame by `step` and `timestampSeconds`; it must not recalculate, clone, sample, or add scientific values.
4. Flow animation remains **derived activity**, not measured flow rate.
5. Existing `ScientificEventJournal`, recorder, replay, and evidence contracts remain unchanged.

## Planned Verification

The implementation will add unit tests for event normalization, sensitive-data redaction, auth gate states, frame-reference-only logging, and 3D interaction/runtime event emission. Browser P10 remains blocked until a legitimate operator session exists on the correct deployment.
