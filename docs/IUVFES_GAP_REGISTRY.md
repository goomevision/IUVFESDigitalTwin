# IUVFES Gap Registry

> **Status vocabulary:** `OPEN`, `PENDING_VERIFICATION`, `BLOCKED`, `OUT_OF_SCOPE`, `RESOLVED`.
>
> This registry is a living engineering record. It distinguishes implemented code paths from behaviour that has been demonstrated by tests, browser runtime verification, or a reproducible evidence package.

## Audit Baseline

| Field | Value |
|---|---|
| Local branch | `feature/control-room-ui` |
| Local baseline commit | `54447e9439f98e1f68d1325d0314f7ec53aef5f1` |
| Audit mode | Static/source-contract review; no synthetic experiment was created. |
| Scientific boundary | All current operational telemetry is **SIMULATION** or **DERIVED** unless an independent laboratory dataset establishes otherwise. |

## Open and Blocked Gaps

| ID | Area | Status | Evidence | Risk / Required closure |
|---|---|---|---|---|
| G-001 | Git source of truth | **PENDING_VERIFICATION** | Local Master Quality work was protected in a commit and rebased onto remote recovery commit `52e9370`; the final remote head must still be verified after push. | Push without merge or force update, then verify the branch/PR/CI head. |
| G-002 | Authenticated browser verification | **BLOCKED** | Preview OAuth returned `invalid auth state` and then `Auth Missing`; no real persisted experiment could be opened in the browser. | Verify 3D camera, selection, view mode, layer controls, and mount/unmount behaviour using an authenticated operator session and an existing experiment. Do not create synthetic runtime data merely to close this gate. |
| G-003 | Session recovery from UI refresh | **PENDING_RUNTIME** | `closedLoop.getForExperiment` now returns the authorized persisted session and `ProcessSimulator` adopts its canonical session id without a new create call. | Verify a real browser refresh/resume under an authenticated operator session. |
| G-004 | Replay evidence determinism | **RESOLVED** | `buildReplayEvidenceCanonicalBody()` excludes `exportedAt`; `ExperimentReplay.test.ts` verifies equal canonical bodies for the same selected frames. | Retain the regression test. |
| G-005 | Process-path animation coverage | **OPEN** | The vapor topology contains reactor → Trap 1 → Trap 2 → Trap 3 → Trap 4 → pump, but `updateParticles(vaporParticles, vaporPaths[0], ...)` animates only the first path segment. | Either animate all authoritative vapor segments or label the first-segment visual explicitly; preserve `UNKNOWN` for non-modelled mass-flow rate. |
| G-006 | Full 3D/WebGL lifecycle testing | **PENDING_VERIFICATION** | Client tests validate pure state helpers and actuator mappings under the Node test environment. They do not mount a WebGL renderer, exercise pointer selection, or assert disposal under a browser-capable environment. | Add browser/Playwright or equivalent interaction and lifecycle coverage after authenticated preview access is available. |
| G-007 | Laboratory evidence ingestion | **PENDING_VERIFICATION** | Shared contracts define `EXPERIMENTAL`, `SIMULATION`, `DERIVED`, and `AI_ANALYSIS`, but no verified audited path was demonstrated from calibrated laboratory instrument ingestion to a validated report result. | Complete only with identified instrument, calibration, sample, and provenance evidence. |
| G-008 | Context-aware material knowledge | **PENDING_VERIFICATION** | The intake architecture supports scientific metadata, while the full P8 context taxonomy requires verified persistence and comparison semantics. | Audit the stored schema and application queries before calling P8 complete. |
| G-009 | Bundle performance | **OPEN** | Production build passes with a non-blocking JavaScript bundle-size warning. | Measure route/chunk cost and split only after correctness and provenance gates are stable. |
| G-010 | Scientific record identity | **RESOLVED** | Recorder supplies `sourceExperimentId`; `resolveScientificRecordIdentity()` preserves it as the research provenance key and replaces the synthetic sample default with `UNKNOWN`. | Retain identity unit coverage and authorization checks. |
| G-011 | Legacy batch replay boundary | **RESOLVED** | `ExperimentReplay` now reads `closedLoop.replayForExperiment`; the legacy `simulation.run` stream is not used for scientific causal replay. | Preserve the explicit legacy exclusion message. |
| G-012 | Recovery test isolation | **RESOLVED** | The experiment-id fallback regression explicitly clears the id lookup mock before asserting the experiment lookup path. | Retain the focused test. |

## Explicitly Not Treated as a Defect

| Item | Reason |
|---|---|
| Derived 3D particles | The renderer labels flow animation as **derived activity** and reports flow rate as `UNKNOWN`; it does not claim a measured flow sensor. |
| Simulation metrics shown in the Control Room | Values originate from the closed-loop CausalFrame and are labelled as simulation-derived rather than laboratory measurements. |
| Optional ultrasonic values | The ultrasonic frame already exposes its model/evidence boundary; an operating frequency is not automatically presented as a resonance fingerprint. |

## Closure Protocol

Each gap can move to `RESOLVED` only when the following evidence is attached in its change record:

1. a source-level change bound to the authoritative contract;
2. a focused regression test where the behaviour is deterministic;
3. static check, full tests, and production build results;
4. browser/runtime evidence when the gap concerns interaction or WebGL lifecycle;
5. an updated Buku Besar and Requirement Registry row.
