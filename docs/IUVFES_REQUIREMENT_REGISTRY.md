# IUVFES Requirement Registry

> The registry separates **implemented** code from **verified** behaviour. A requirement is not complete merely because a component exists.

| Requirement ID | Requirement | Implementation evidence | Test / runtime evidence | Status |
|---|---|---|---|---|
| RQ-001 | One authoritative closed-loop frame connects control, physics, safety, material, diagnostics, and visualization. | `server/closedLoopSimulation.ts` defines `CausalFrame`; `ProcessSimulator` and `ProcessMachine3D` consume it. | `server/causalFrameVisualSync.test.ts`; client mapper tests. | **VERIFIED (contract)** |
| RQ-002 | Pre-actuation control, continuous actuator levels, and post-actuation physical state remain distinct. | `CausalFrame` contains `controller`, `controlOutput`, `actuatorLevels`, `physicalSensorAfter`, and `controllerAfterActuation`. | Simulation and visual-sync regression coverage. | **VERIFIED (contract)** |
| RQ-003 | 3D visual intensity follows continuous actuator levels without inventing telemetry. | `getProcessMachineActuatorVisualLevels()` and renderer emissive/particle speed mappings. | `client/src/components/ProcessMachine3D.test.ts`. | **VERIFIED (unit)** |
| RQ-004 | The 3D Twin provides non-engine-affecting camera navigation, component selection, view modes, and layer controls. | `ProcessMachine3D` owns local view/selection/layer state and `OrbitControls`. | Static review and TypeScript validation; authenticated browser verification remains unavailable. | **PENDING_RUNTIME** |
| RQ-005 | The 3D topology expresses reactor, ultrasonic device, vacuum pump, four cold traps, vapor/vacuum/cooling/electrical paths, and explicit connectors. | `ProcessMachine3D` scene topology and selectable groups. | Static review; no authenticated visual browser acceptance yet. | **PENDING_RUNTIME** |
| RQ-006 | UI interaction does not mutate physics except approved operator controls. | View/selection/layer controls stay local; `ProcessSimulator.control` is the explicit operator path. | Static code review; browser interaction gate blocked by auth. | **PENDING_RUNTIME** |
| RQ-007 | Simulation time drives process visuals; render time drives rendering only. | `timestampSeconds` drives animation phase; `requestAnimationFrame` schedules render. | `causalFrameVisualSync` coverage. | **VERIFIED (contract)** |
| RQ-008 | Session lifecycle supports create, start, step, pause, resume, stop, reset, persistence, and cache-miss recovery. | `closedLoopRouter`, `closedLoopRuntimeStore`, `closedLoopSessionStore`. | Snapshot/restore and runtime recovery tests. | **VERIFIED (server)** |
| RQ-009 | A browser refresh can recover an experiment’s persisted runtime without re-creating the session. | Store supports experiment fallback, but Control Room has no persisted-session discovery entry point. | No end-to-end proof. | **OPEN** |
| RQ-010 | Replay uses structurally valid causal frames and refuses to fabricate missing telemetry. | `normalizeCausalFrame()` rejects incomplete legacy frames. | Static review; replay UI needs authenticated runtime exercise. | **PENDING_RUNTIME** |
| RQ-011 | The same causal-frame range produces stable replay evidence integrity. | Replay exports `IUVFES-REPLAY-EVIDENCE-1` with SHA-256. | Volatile `generatedAt` is currently inside the hashed payload. | **OPEN** |
| RQ-012 | Simulation, derived, experimental, and AI-analysis claims remain distinct. | Shared provenance contracts and Control Room/Replay boundary text. | Static review. | **VERIFIED (contract)** |
| RQ-013 | Ultrasonic values preserve their model/evidence limitations. | `UltrasonicExperimentalFrame` is part of each CausalFrame and exposed to the renderer. | Physics/contract tests; no laboratory validation claim. | **VERIFIED (boundary)** |
| RQ-014 | Material knowledge retains context needed to prevent unsafe generic comparisons. | Scientific metadata/intake and shared scientific contracts exist. | Full persistence/comparison audit incomplete. | **PENDING_VERIFICATION** |
| RQ-015 | Client 3D contract tests execute in the standard test command. | `vitest.config.ts` includes `client/src/**/*.test.ts(x)`. | Latest local test run passed prior to this Master Quality audit. | **VERIFIED (local)** |
| RQ-016 | Quality Gate, build, and browser acceptance are all complete. | TypeScript/test/build and GitHub Action history exist. | Browser gate blocked by OAuth/session state. | **BLOCKED** |

## Evidence Labels

| Label | Meaning |
|---|---|
| **VERIFIED (contract)** | The source contract and focused regression coverage demonstrate the claim. |
| **VERIFIED (unit)** | A focused unit test proves deterministic local behaviour. |
| **VERIFIED (server)** | Server lifecycle/persistence behaviour has focused regression proof. |
| **PENDING_RUNTIME** | Code exists, but browser/WebGL behaviour is not yet observed under a valid session. |
| **PENDING_VERIFICATION** | An architectural or data path exists but has not yet been audited to the stated scope. |
| **OPEN** | A concrete gap is known and must be corrected before the requirement can be verified. |
| **BLOCKED** | Required verification depends on an unavailable authenticated session or protected source-control resolution. |
