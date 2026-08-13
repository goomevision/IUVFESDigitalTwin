# IUVFES Digital Twin — Patch Log

## 2026-08-13 — Closed-loop runtime persistence hardening

### Scope
Small, reversible runtime persistence refinement on `feature/control-room-ui`.

### Changes
1. `server/closedLoopSessionStore.ts`
   - Persist the actual in-memory `sessionId` as the `closedLoopSessions.id`.
   - Preserve the stable session identity on upsert, including replacement of an older persisted session row for the same experiment.
   - Add `getClosedLoopSessionById()` for direct runtime recovery.
   - Keep experiment-based lookup for compatibility/fallback.

2. `server/closedLoopRuntimeStore.ts`
   - Add `ensureRuntimeSession()` cache-miss hydration from `closedLoopSessions`.
   - Reconstruct `ClosedLoopSimulationEngine` from the persisted `snapshot.configuration`.
   - Call `engine.restore(snapshot)` so sensors, state machine, dynamics, controller, targets, ultrasonic state, paused steps, and full CausalFrame history are restored together.
   - Keep the in-memory Map as the hot path; database lookup occurs only when a runtime session is not resident.
   - Support experiment-id fallback when the caller does not have the persisted runtime session id.

3. `server/closedLoopRouter.ts`
   - Hydrate runtime state before `start`, `step`, `control`, `pause`, `resume`, `stop`, `reset`, `get`, `frames`, and `snapshot` operations.
   - Persist the actual runtime session id on every runtime snapshot save.

### Scientific / safety boundary
- No simulation equations, hardware dynamics, PID logic, CausalFrame schema, research observation schema, Firebase logic, or database schema were changed.
- No package installation or dependency change.
- No destructive data operation.
- Existing `simulationResults` and `datasetManifests` paths remain unchanged.

### Verification status
- Source-level audit completed against `closedLoopSimulation.ts`, `closedLoopRuntimeStore.ts`, `closedLoopSessionStore.ts`, `closedLoopRouter.ts`, `researchDb.ts`, `drizzle/schema.ts`, and `scientificDatasetPersistence.ts`.
- `ClosedLoopSimulationEngine.restore()` already exists and is now wired into runtime recovery.
- Automated `pnpm check` / `pnpm test` were not executed through the repository connector in this patch; deployment/build verification remains required before production use.

### Expected result
A Control Room runtime session can now be reconstructed from its persisted closed-loop snapshot after the Node process/runtime Map is lost, while retaining the same persisted session identity for subsequent API operations.
