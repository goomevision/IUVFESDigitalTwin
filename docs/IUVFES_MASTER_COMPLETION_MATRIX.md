# IUVFES Master Quality Completion Matrix

**Branch:** `feature/control-room-ui`  
**Head at assessment:** `c91f930acd23eafafa718b8e6390c69faeed50e8`  
**Assessment date:** 25 August 2026  
**Scope:** Master Quality and Completion pass; no merge to `develop` or `main`.

> **Status vocabulary:** `VERIFIED` requires source, focused test where deterministic, and the applicable quality gate. `PENDING` means implemented but lacking required runtime or domain evidence. `BLOCKED` requires an unavailable prerequisite. `OUT_OF_SCOPE` is not delivered by the current scientific boundary.

| Area | Status | Evidence | Boundary / next condition |
|---|---|---|---|
| Git source-of-truth protection | **VERIFIED** | Local registry work was committed, rebased onto `52e9370`, then pushed as `c91f930`. | No merge was performed. |
| Closed-loop CausalFrame contract | **VERIFIED** | `closedLoopSimulation.ts`, causal visual-sync tests, and 3D mapper tests. | Simulation-derived only. |
| 3D actuator mapping | **VERIFIED** | Continuous actuator-level mapper and focused client tests. | Browser/WebGL interaction remains separately pending. |
| 3D navigation, selection, modes, layers | **PENDING** | Local visual state and controls are implemented. | Requires authenticated browser verification with an existing persisted experiment. |
| Session lifecycle and recovery | **VERIFIED** | Runtime snapshot/recovery tests and typed `getForExperiment` path. | Browser refresh/resume remains pending runtime observation. |
| Replay source authority | **VERIFIED** | Replay consumes `closedLoop.replayForExperiment`; legacy batch results are excluded from causal evidence. | Existing legacy outputs remain for compatibility outside scientific replay. |
| Replay checksum canonicalization | **VERIFIED** | Canonical body excludes `exportedAt`; deterministic evidence unit test passes. | Server-side signing and immutable storage remain future work. |
| Scientific record identity | **VERIFIED** | Original experiment provenance key is preserved; absent sample identity is `UNKNOWN`. | Does not establish a laboratory sample or validation. |
| Laboratory ingestion and calibration | **PENDING** | Provenance types and scientific recorder exist. | Requires identified instruments, calibration, sample evidence, and audited ingest path. |
| Context-aware material knowledge | **PENDING** | Intake/scientific contracts support metadata. | Persistence and comparison semantics need a dedicated audit. |
| WebGL mount/unmount lifecycle | **PENDING** | Defensive cleanup and pure client tests exist. | Requires browser-capable lifecycle test or authenticated manual acceptance. |
| Bundle performance | **PENDING** | Production build passes. | JavaScript bundle warning remains; profile before route splitting. |
| Physics/laboratory validation claim | **OUT_OF_SCOPE** | No lab dataset, calibration, or validation study was introduced. | Never infer validation from simulation success. |

## Quality Gate Evidence

| Gate | Result |
|---|---|
| `git diff --check` | PASS before commit |
| `pnpm check` | PASS |
| `pnpm test` | PASS — 28 files, 71 tests |
| `pnpm build` | PASS; bundle-size warning is non-blocking |
| GitHub Actions: IUVFES Quality Gate | PASS — run `32771858416` |
| GitHub Actions: Control Room Phase 1 Validation | PASS — run `32771852180` |
| GitHub Pages deploy workflow | PASS — run `32771852187` |
| Authenticated browser acceptance | BLOCKED — preview OAuth returned `invalid auth state` and `Auth Missing` |

## Scientific Boundary

All Control Room, replay, and evidence values remain **SIMULATION** or **DERIVED** unless a separately identified laboratory dataset establishes a different provenance. Flow particles are derived process activity, not measured mass-flow telemetry. Missing information remains `UNKNOWN`; no result is fabricated to close an acceptance gate.

## Required Next Gate

Use an authenticated operator session and an existing persisted experiment to verify browser refresh/recovery, Start/Pause/Resume/Stop/Reset, camera presets, pointer selection, view modes, layers, and WebGL cleanup. Record those observations before changing any `PENDING` 3D/runtime status to `VERIFIED`.
