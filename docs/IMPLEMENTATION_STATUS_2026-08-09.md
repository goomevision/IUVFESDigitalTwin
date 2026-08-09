# IUVFES Scientific Foundation — Implementation Status

Date: 2026-08-09

## Completed in this pass

- Created isolated branch `fix/scientific-foundation-p0` from the current scientific-data foundation work.
- Fixed the Quality Gate workflow so `pnpm/action-setup@v4` reads the repository `packageManager` declaration instead of receiving a second explicit pnpm version.
- Kept the package manager declaration and dependency versions aligned with the current branch state.
- Added explicit high-priority tracking for the three remaining correctness/security gaps:
  - closed-loop, genuinely pauseable simulation;
  - immutable raw dataset persistence and checksum-bound storage;
  - experiment ownership enforcement on simulation result reads.

## Verified architectural gaps still requiring implementation

### 1. Closed-loop execution
The current `simulation.run` still invokes `PhysicsSimulationEngine.runSimulation()` to calculate a complete frame series and then applies controller/dynamics logic over those already-produced frames. The UI then advances a cursor through the returned frames. This is not yet a causal real-time simulation loop.

Required target:

`read sensors -> interlocks -> controller -> actuator commands -> physics/dynamics -> next sensors -> persist frame -> repeat`

Pause must stop state evolution, not merely stop cursor playback.

### 2. Raw dataset persistence
`ScientificRunRecorder` creates a SHA-256 manifest, but its current `storageRef` is an inline URI. The manifest therefore identifies a payload without establishing an immutable object-storage artifact that can be retrieved and checksum-verified later.

Required target:

`raw frames -> immutable object storage -> SHA-256 -> manifest -> provenance`

Display sampling must remain a derived/UI representation and must not replace the raw dataset.

### 3. Result authorization
Research endpoints enforce ownership, but the current `simulation.getResults` path only checks authentication before loading a result. It must verify the result's parent experiment belongs to the current user, with an explicit admin policy where appropriate.

### 4. Calibration and instrument chain
Instrument and calibration tables exist, but the experiment workflow does not yet bind sensor observations to a verified calibration record. This remains required before real laboratory observations can be treated as validated measurements.

### 5. Real instrument ingestion
The repository still uses simulated measurements as its primary acquisition source. A real instrument gateway (e.g. protocol adapter -> validation -> raw acquisition -> digital twin) remains a separate implementation phase.

### 6. Validation/calibration of physics
The material physics layer is deterministic and explicitly requires calibration before operational use. No claim of industrial accuracy should be made until real experimental data is used to fit and validate model parameters.

## Quality gate

The workflow now executes:

1. checkout
2. pnpm setup from `packageManager`
3. Node 22 setup with pnpm cache
4. frozen dependency install
5. TypeScript check
6. unit tests
7. production build

The workflow configuration itself was fixed in this pass. A successful run must still be observed before marking the gate green.
