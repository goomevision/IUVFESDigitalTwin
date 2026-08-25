# P25 — Verified Runtime Integration Preflight

**Date:** 26 August 2026
**Auditor:** Manus AI
**Repository / branch:** `goomevision/IUVFESDigitalTwin` / `feature/control-room-ui`
**Mode:** Read-only preflight; no login, runtime query, session creation, deployment, migration, database mutation, or application patch.
**Final classification:** **BACKEND DEPLOYMENT REQUIRED**.

> P25 separates source presence from deployment identity, runtime readiness, authentication readiness, and scientific readiness. No status is promoted to `VERIFIED` merely because source code exists.

## Source Identity

| Check | Status | Evidence |
|---|---|---|
| Branch | **VERIFIED** | `feature/control-room-ui` is checked out. [1] |
| Local HEAD | **VERIFIED** | `f9f677f3289a38a31311b0f9b3a0de1d35582a1b`. [1] |
| Remote branch HEAD | **VERIFIED** | `origin/feature/control-room-ui` resolves to the same SHA. [1] |
| Remote alignment | **VERIFIED** | Local and remote feature heads match. [1] |
| Application source working tree | **VERIFIED** | No pending application-source diff; the P25 tracker is the only preflight-local change. [1] |
| Backend source identity | **READY** | Authoritative closed-loop, session store, runtime store, event journal, dataset persistence, and OAuth modules are present in the checkout. [2] |

## Ordered Preflight

| # | Prerequisite | Source readiness | Deployment / runtime readiness | P25 status | Interpretation |
|---|---|---|---|---|---|
| 1 | Git HEAD and remote alignment | Present | N/A | **VERIFIED** | Git source identity is aligned. |
| 2 | Backend source identity | Full source modules present | Release identity on a deployed full backend is not established | **READY** | Source is necessary but not sufficient. |
| 3 | Deployment identity | N/A | No exposed full GitHub-backend deployment can be matched to the current SHA | **UNVERIFIED** | **First fundamental blocker.** |
| 4 | Closed-loop routes | `closedLoop.create/start/step/control/pause/resume/stop/reset/getForExperiment/replayForExperiment` exist | Endpoint presence on correct deployment is not tested | **READY** | Routes are source-present and protected. [3] |
| 5 | Database schema compatibility | Source schema includes closed-loop sessions, journal, dataset, provenance, research/instrument tables | Production schema remains unverified | **READY** | Source-only compatibility. [4] |
| 6 | Migration status | Canonical source journal contains `0000`–`0003` | Production migration status not checked or approved | **UNVERIFIED** | No migration run in P25. [5] |
| 7 | OAuth route availability | Backend-owned `/api/oauth/login` and callback routes exist | Correct deployed callback host is not established | **READY** | Source-only route readiness. [6] |
| 8 | CORS | GitHub Pages origin plus configured origins are supported in source | Response headers on correct deployment are not tested | **READY** | Source-only CORS readiness. [7] |
| 9 | `auth.me` | `auth.me` returns request-context user in source | No query and no login performed | **UNVERIFIED** | Authenticated operator readiness cannot be asserted. [8] |
| 10 | Existing experiment | Protected `experiments.get/list` source exists | No authenticated query was performed | **UNVERIFIED** | No experiment was created or inspected. [8] |
| 11 | Existing canonical session | `getForExperiment` and session persistence source exist | No authenticated canonical-session lookup was performed | **UNVERIFIED** | No session was created, hydrated, or queried. [3] |
| 12 | ProcessSimulator | Source mount point exists after an experiment ID is available | Authenticated mount not tested | **READY** | Runtime depends on items 3, 9, and 10. [9] |
| 13 | ProcessMachine3D | Renderer source is imported by ProcessSimulator | Renderer mount not tested | **READY** | Runtime depends on authenticated ProcessSimulator. [10] |
| 14 | WebGL | Three.js/OrbitControls and cleanup source exist | No browser/WebGL probe was run | **NOT TESTED** | No authenticated WebGL acceptance. [10] |
| 15 | Replay | Source replay route and visual reader exist | No persisted session/frame chain was queried | **READY** | Runtime replay remains unverified. [3] [11] |
| 16 | Scientific event journal | Canonical journal and event-hash source exist | No deployed journal persistence observed | **READY** | Runtime availability unverified. [12] |
| 17 | Dataset / provenance / evidence | Schema and P20–P23 contracts exist | No real laboratory evidence or deployed records loaded | **UNAVAILABLE** | Scientific evidence is absent by design. [4] [13] |
| 18 | P15–P24 integration | P24 found no cross-phase source conflict | Runtime integration is blocked by deployment identity | **READY** | Static/source integration only. [13] |

## Backend, Database, and OAuth Readiness

The source has a protected closed-loop router. It derives session access from authenticated experiment ownership, rehydrates/persists canonical sessions, and exposes recovery/replay queries only after access control. [3] OAuth source owns its login/callback sequence, validates the return origin and nonce/state, and creates a session cookie only after provider exchange. [6] CORS source allows the GitHub Pages origin and configured origins with credentials. [7]

These source facts do **not** prove that a deployment running this exact SHA exists. The recorded P24 infrastructure decision remains that a full GitHub backend deployment is not available in the exposed runtime; production database backup, restore, PITR, and migration ownership are unknown. [13] Because deployment identity cannot be established, P25 stops before authentication, existing experiment, session, UI, WebGL, replay, or journal runtime acceptance.

| Readiness dimension | Status | Reason |
|---|---|---|
| **SOURCE READY** | **YES** | Required source modules, schemas, route wiring, OAuth/CORS source, and Control Room components are present. |
| **DEPLOYMENT READY** | **NO** | No verifiable full backend release identity for the current Git SHA. |
| **RUNTIME READY** | **NO** | Cannot test protected routes or UI mount against an identified matching deployment. |
| **AUTH READY** | **UNVERIFIED** | Login/auth.me intentionally not invoked; a matching backend/session is not established. |
| **SCIENTIFIC READY** | **NO** | No real laboratory evidence, calibrated measurement, provenance, uncertainty, comparison, or validation record is loaded. |

## Control Room and Scientific Integration

`ScientificExperimentFlow` places `ProcessSimulator` behind `ControlRoomAccessGate`, and mounts it only when an experiment ID exists. `ProcessSimulator` then queries `closedLoop.getForExperiment` for canonical recovery. [9] P15 renderer source maps visual time to `frame.timestampSeconds`, observed process values to `frame.sensorAfter`, command authority to `frame.effectiveCommands`, and visual actuator intensity to `frame.actuatorLevels`. [10]

P17–P23 remain evidence-bound: P17 simulation channels are not physical instruments; P18 has no verified traceability chain; P19 contains no quantified uncertainty; P20 has zero evidence records; P21 comparisons are blocked; P22 does not calculate absent-content hashes; and P23 does not make visual replay equivalent to reproducibility. [13]

> The scientific boundary remains: **SIMULATION ≠ MEASURED**, **DERIVED ≠ MEASURED**, **UNKNOWN ≠ ZERO**, **NOT LOADED ≠ ZERO**, **COMPLETE ≠ VERIFIED**, **READY FOR VERIFICATION ≠ VERIFIED**, **COMPARISON ≠ VALIDATION**, and **Replay visual ≠ scientific reproducibility**.

## First Blocking Dependency

**BLOCKER:** Deployment identity is **UNVERIFIED**, and the documented full GitHub backend deployment is unavailable in the exposed runtime. This is earlier and more fundamental than OAuth state, existing experiment availability, canonical session lookup, UI mount, or WebGL acceptance.

**Exact external action required:** An authorized infrastructure owner must deploy the complete GitHub backend from a verifiable release built from `feature/control-room-ui`, expose its immutable release/commit identity and API base URL, and provide approved production database backup/restore/PITR/migration ownership. No application-source workaround can satisfy this prerequisite.

## Final Classification

**BACKEND DEPLOYMENT REQUIRED.** P25 does not permit authenticated runtime acceptance yet. When the external action is complete, the next preflight may verify deployment identity first; only then may a legitimate operator login, existing experiment lookup, and existing canonical-session lookup be considered. No new experiment, session, telemetry, scientific data, laboratory evidence, synthetic data, or authentication workaround is authorized by this report.

## References

[1]: ../.git/ "P25 local Git and remote-alignment inspection"
[2]: ../server/ "Authoritative backend source module presence"
[3]: ../server/closedLoopRouter.ts "Protected canonical closed-loop lifecycle, recovery, and replay routes"
[4]: ../drizzle/schema.ts "Canonical source schema for closed-loop, scientific identity, dataset, provenance, and journal records"
[5]: ../drizzle/meta/_journal.json "Canonical source migration journal"
[6]: ../server/_core/oauth.ts "Backend OAuth login and callback source"
[7]: ../server/_core/index.ts "CORS configuration and OAuth route registration"
[8]: ../server/routers.ts "auth.me and protected experiment router source"
[9]: ../client/src/pages/ScientificExperimentFlow.tsx "Control Room auth/experiment gate and ProcessSimulator mount"
[10]: ../client/src/components/ProcessMachine3D.tsx "P15 renderer authority mapping and controls"
[11]: ../client/src/components/ProcessRunReplay.tsx "Visual replay source"
[12]: ../server/scientificEventJournal.ts "Canonical scientific event journal source"
[13]: ./P24_INTEGRATED_SYSTEM_AUDIT.md "Integrated system audit and infrastructure blocker evidence"
