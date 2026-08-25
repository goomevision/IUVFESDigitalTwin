# P26 — Deployment Readiness Specification

**Specification mode:** Documentation only / read-only
**Baseline source release:** `150f84b81bb19b9090acc96806d1b0e836b4e118`
**Source branch:** `feature/control-room-ui`
**Baseline documents:** [P24 Integrated System Audit](./P24_INTEGRATED_SYSTEM_AUDIT.md) and [P25 Runtime Integration Preflight](./P25_RUNTIME_INTEGRATION_PREFLIGHT.md)

> This specification defines the minimum external deployment and governance conditions needed before authenticated runtime acceptance. It does not authorize a deployment, migration, login, database mutation, experiment/session creation, or scientific-data action.

## 1. Required Source Release

The deployment candidate **must** be built from Git SHA `150f84b81bb19b9090acc96806d1b0e836b4e118` on `feature/control-room-ui`. A deployment of a different branch, a legacy Manus application, a Home/LiveDashboard runtime, or an unverifiable build is not an eligible P10 target.

| Scope | Required component |
|---|---|
| Frontend | GitHub Control Room routes: `ScientificExperimentFlow`, `ProcessSimulator`, `ProcessMachine3D`, replay, Knowledge Center, and P17–P23 evidence-bound presentation surfaces. |
| Backend/API | Express/tRPC server with `appRouter`, `closedLoopRouter`, `closedLoopSimulation`, session/runtime stores, event journal, dataset persistence, database access, and backend-owned OAuth routes. |
| Closed-loop dependency | The deployed API must expose the protected canonical lifecycle and recovery route set, including `closedLoop.getForExperiment` and `closedLoop.replayForExperiment`. |
| Excluded runtime | The separate legacy Manus `Home → SetupWizard` application is not the P10 Control Room source or target. |

## 2. Deployment Architecture

| Architecture element | Required specification |
|---|---|
| Frontend host | A static host serving the Control Room bundle from the required release. The frontend origin must be known and immutable for the release. |
| Backend/API host | A separately identifiable full Node/Express/tRPC deployment serving the required release, not a partial or legacy backend. |
| API base URL | An explicit HTTPS API base URL bound to the full backend release. The frontend must be configured for that URL; it must not silently fall back to another runtime. |
| OAuth callback | `https://<backend-api-host>/api/oauth/callback`; callback origin must be derived/validated by the deployed backend and registered with the OAuth provider. |
| OAuth login | `https://<backend-api-host>/api/oauth/login?returnTo=<approved-frontend-origin>`; only approved HTTPS frontend origins are valid. |
| Cookie requirement | Backend-owned secure, HTTP-only session and nonce cookies with `SameSite=None` where cross-origin flow requires it. The session boundary stays on the API host. |
| CORS requirement | Backend must return the exact allowed frontend origin, `Access-Control-Allow-Credentials: true`, required methods/headers, and a valid preflight response. Wildcard origin is not acceptable with credentials. |

## 3. Database and Migration Requirements

The canonical source migration chain is:

```text
0000_youthful_daredevil
  → 0001_purple_ozymandias
  → 0002_known_wolfpack
  → 0003_open_peter_quill
```

Migration execution **must not** happen automatically as part of frontend deployment, application startup, or P10 testing. It requires a separately approved change window and the recovery prerequisites below.

| Database domain | Required source tables / compatibility |
|---|---|
| Runtime lifecycle | Base user/experiment/control-action tables and `closedLoopSessions`. |
| Scientific record chain | `scientificEventJournal`, `datasetManifests`, and `provenanceRecords`. |
| Evidence-ready schema | `researchExperiments`, `experimentInstruments`, `instrumentCalibrations`, `sensorObservations`, and `operatorObservations`. |
| Material / experiment intake | Canonical material and experiment tables required by protected existing-experiment lookup. |

Before any migration, the owner must provide verified **backup**, **restore**, **PITR**, migration ownership, release ownership, and a rollback/recovery procedure. Application checkpoint rollback is not a database rollback strategy.

## 4. Release Identity

The deployment system must generate and expose an immutable release identity that proves all of the following:

1. deployed Git commit SHA;
2. source branch or immutable release artifact;
3. backend/API release identity;
4. frontend bundle release identity; and
5. deployment timestamp/build reference.

The identity must be produced by the deployment system or signed build artifact. It must **never** be simulated by manually adding an `X-Commit-SHA` header, static label, browser-local value, or frontend-only string. If frontend and API identities cannot both be verified against the required source release, stop with **DEPLOYMENT IDENTITY UNVERIFIED**.

## 5. Environment Categories

The deployment owner must configure categories of environment values without exposing secret names' values in browser output, source files, documentation, logs, or screenshots.

| Category | Purpose |
|---|---|
| Database connection and TLS | Connect the full backend to the approved production database. |
| Session / JWT signing | Sign and validate backend-owned authentication sessions. |
| OAuth application/provider | Identify the OAuth application and provider endpoint, and register the backend callback. |
| Frontend/API origin configuration | Bind the frontend to the correct backend API URL and allow only approved frontend origins. |
| CORS / return-target allowlist | Preserve GitHub Pages/custom frontend origin rules and exact credential behavior. |
| Deployment identity | Provide immutable build/release metadata generated by the deployment system. |
| Storage / scientific dataset integration | Configure approved server-side storage references where those features are enabled. |
| Observability | Configure operator-safe runtime logging/health monitoring without promoting browser-local telemetry to scientific evidence. |

## 6. Rollback and Recovery

| Scenario | Required action | Limitation |
|---|---|---|
| Application release failure | Roll back the frontend and full backend together to a prior immutable deployment artifact. | Application rollback does not restore database schema or data. |
| Migration failure | Stop migration; use the approved database rollback/recovery procedure. | A code rollback alone is not a schema rollback. |
| Data integrity incident | Restore from verified backup or execute approved PITR with named owner oversight. | No recovery action is permitted until backup/PITR capability is verified. |
| OAuth/cookie regression | Roll back both frontend/API release identity or correct external configuration through an approved release. | Do not bypass nonce, cookie, callback, or return-target checks. |

## 7. Health Gate After Deployment Only

The following checks may begin **only after** the deployment identity and database-governance prerequisites are verified. They are ordered and non-substitutable.

1. Verify frontend release identity and backend/API release identity match the required release.
2. Verify `/health` on the full backend and confirm its response belongs to the identified release.
3. Verify OAuth callback registration and approved frontend return target.
4. Verify OAuth login redirect and one-time nonce cookie behavior with a legitimate operator action.
5. Verify credentialed CORS preflight and API response headers from the actual frontend origin.
6. Verify `auth.me` returns the legitimate operator identity.
7. Query an **existing** authorized experiment; do not create one.
8. Query `closedLoop.getForExperiment` for an **existing** canonical session; do not create one.
9. Verify canonical replay availability through `closedLoop.replayForExperiment`.
10. Verify `ProcessSimulator` mounts for that existing experiment and recovered session.
11. Verify `ProcessMachine3D` mounts exactly once and follows CausalFrame authority.
12. Verify WebGL, console, DOM, and cleanup health through the required P10 acceptance sequence.

## 8. P10 Acceptance Order

```text
Deployment identity
  → database verification
  → OAuth callback / CORS verification
  → legitimate operator authentication
  → existing experiment
  → existing canonical ClosedLoop session
  → read-only closed-loop verification
  → replay verification
  → ProcessSimulator / ProcessMachine3D mount
  → 3D / WebGL acceptance
```

The control room remains a CausalFrame consumer: `timestampSeconds` is simulation time, `sensorAfter` supplies process values, `effectiveCommands` supplies command authority, and `actuatorLevels` supplies visual actuator intensity. No deployment action may turn simulation or derived display state into measured laboratory evidence.

## 9. Stop Conditions

| Stop condition | Required response |
|---|---|
| **DEPLOYMENT IDENTITY UNVERIFIED** | Stop before OAuth/auth/experiment/session/API acceptance. Obtain externally generated release identity. |
| **DATABASE INCOMPATIBLE** | Stop before session, journal, replay, or migration action. Escalate to approved migration/recovery owner. |
| **OAUTH BLOCKED** | Stop before `auth.me`, experiment, session, or 3D acceptance. Correct provider/callback/return-target configuration through approved deployment configuration. |
| **AUTH BLOCKED** | Stop before closed-loop lookup. Do not create a user/session or bypass authentication. |
| **CANONICAL SESSION UNAVAILABLE** | Stop P10 lifecycle/3D acceptance. Report the existing-session/deployment blocker; do not create a session. |
| **RUNTIME BLOCKED** | Stop browser/runtime acceptance. Capture only non-mutating technical evidence and return to the earlier failed prerequisite. |

## 10. Final Decision

| Decision | Status |
|---|---|
| **SOURCE** | **READY** |
| **RUNTIME** | **BLOCKED** |
| **FIRST BLOCKER** | **BACKEND DEPLOYMENT** |
| **P10** | **BLOCKED** |

P26 does not authorize a deployment, migration, operator login, experiment/session creation, synthetic data, scientific evidence, or workaround. The next permitted action is external: provide the verifiable full-backend deployment and database recovery governance described above.

## References

[1]: ./P24_INTEGRATED_SYSTEM_AUDIT.md "Integrated source, static, runtime, evidence, and infrastructure readiness audit"
[2]: ./P25_RUNTIME_INTEGRATION_PREFLIGHT.md "Read-only runtime integration preflight and first deployment blocker"
[3]: ../server/closedLoopRouter.ts "Canonical protected closed-loop lifecycle, recovery, and replay routes"
[4]: ../server/_core/oauth.ts "Backend-owned OAuth callback and nonce source"
[5]: ../server/_core/index.ts "CORS and health route source"
[6]: ../drizzle/meta/_journal.json "Canonical migration chain"
