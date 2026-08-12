# IUVFES CONTROL ROOM — PARALLEL WORKSTREAM CONTRACT

> **Purpose:** establish a strict contract for parallel development of the Control Room so multiple AI/workers can work simultaneously without overwriting each other, duplicating work, changing scientific contracts, or creating incompatible UI states.
>
> Repository: `goomevision/IUVFESDigitalTwin`
> Branch: `feature/control-room-ui`
> Date: 2026-08-12
>
> This document is an execution contract. The Buku Besar remains the architectural SSOT. This document defines **parallel ownership, boundaries, inputs, outputs, and integration rules** for P1–P12.

---

## 1. CORE PRINCIPLE

```text
PARALLEL WORK
      ↓
SEPARATE OWNERSHIP
      ↓
FIXED CONTRACTS
      ↓
INDEPENDENT VALIDATION
      ↓
INTEGRATION BRANCH
      ↓
CROSS-WORKSTREAM QA
      ↓
QUALITY GATE
```

Parallel work is allowed. **Uncontrolled overlapping edits are not.**

A worker may inspect another workstream's files to understand dependencies, but must not modify another workstream's owned implementation unless the integration owner explicitly assigns that task.

---

## 2. MANDATORY READING PACK

Every worker must read:

1. `docs/BUKU_BESAR_IUVFES_DIGITAL_TWIN.md`
2. `docs/CONTROL_ROOM_NEXT_WORK_ORDER.md`
3. `docs/CONTROL_ROOM_PARALLEL_WORKSTREAM_CONTRACT.md`
4. `IUVFES_CONTROL_ROOM_STAGED_UI_WORK_MAP.md` if present in the repository
5. The source files explicitly listed for that worker below.

Workers must not assume that a component, API, data field, or scientific claim exists merely because it is mentioned in a planning document. Verify it in source code before implementation.

---

## 3. NON-NEGOTIABLE SCIENTIFIC RULES

1. Do not invent telemetry.
2. Do not create scientific values solely for visual appearance.
3. Do not replace `CausalFrame` with a local UI frame contract.
4. Do not convert literature experimental frequency into resonance `f0` without evidence.
5. `UNKNOWN` is a valid scientific state.
6. Simulation-derived output remains `SIMULATION`.
7. Literature observations remain `LITERATURE` / `OBSERVED`.
8. Laboratory observations require laboratory provenance.
9. AI analysis must remain distinguishable from observation.
10. Estimates/hypotheses must never silently become facts.
11. Any missing value must remain missing or explicitly show `UNKNOWN` / `NOT AVAILABLE`.
12. Physics/engine behavior must not be altered merely to make UI output look better.

---

## 4. WORKSTREAM OWNERSHIP MATRIX

| Workstream | Owner scope | Primary output | Must NOT own |
|---|---|---|---|
| **P1** | Master Map + Design Tokens | visual tokens, hierarchy, UI map | runtime behavior, engine, feature panels |
| **P2** | Control Room Shell | grid, zones, panel shell | header logic, machine internals, charts |
| **P3** | Header/Nav/Operator | status header, navigation, operator controls | 3D machine, charts, recorder |
| **P4** | 3D Machine | ProcessMachine3D visual/binding | global shell, recorder, scientific model |
| **P5** | Instrument | live metric cards/gauges | trend engine, causal inspector |
| **P6** | Trend | charts and synchronized frame cursor | source telemetry generation |
| **P7** | Causal Inspector | causal frame interpretation UI | engine causal logic unless separately assigned |
| **P8** | Timeline | event timeline and frame selection | evidence storage, replay engine |
| **P9** | Recorder/Evidence | evidence audit/recorder integrity | visual redesign outside recorder scope |
| **P10** | Replay | replay audit, synchronization, determinism | new telemetry or scientific model |
| **P11** | State Handling | loading/unknown/error/safety/session states | feature-specific data generation |
| **P12** | Responsive/Visual QA | visual audit and bounded fixes | engine/API/scientific changes |

---

## 5. FILE OWNERSHIP RULE

Each worker must maintain a list of:

```text
OWNED FILES
READ-ONLY DEPENDENCIES
FILES NOT TO TOUCH
```

If a required change is outside ownership:

```text
DISCOVER PROBLEM
      ↓
DOCUMENT BLOCKER
      ↓
DO NOT PATCH OTHER WORKSTREAM
      ↓
SEND TO INTEGRATION OWNER
```

A worker must never use a convenient neighboring file as an excuse to expand scope.

---

## 6. P1 — MASTER MAP + DESIGN TOKENS

### Read

- Buku Besar
- Control Room Work Order
- existing UI/theme/token files
- `ProcessSimulator.tsx` for context only

### Build

- spacing scale
- typography hierarchy
- panel/card language
- border/radius language
- status vocabulary
- provenance vocabulary
- layer/z-index conventions
- reusable visual primitives
- master Control Room zone map

### Do not build

- process machine
- header behavior
- charts
- recorder
- replay
- engine logic

### Acceptance

All later workers can consume one coherent visual vocabulary.

---

## 7. P2 — CONTROL ROOM SHELL

### Read

- Buku Besar
- Work Order
- P1 output
- existing `ProcessSimulator.tsx`

### Build

Stable zones:

```text
SYSTEM HEADER
OPERATOR RAIL | PROCESS HERO | SYSTEM/SAFETY RAIL
INSTRUMENT STRIP
TREND / ANALYTICS
CAUSAL / TIMELINE / EVIDENCE AREA
```

### Acceptance

Desktop target layouts have no unintended overlap or horizontal overflow.

---

## 8. P3 — HEADER / NAV / OPERATOR

### Read

- Buku Besar
- P1
- P2
- existing session/control API

### Build

- system status
- experiment/session identity
- timestamp
- primary navigation
- START / PAUSE / RESUME / STOP / RESET hierarchy
- safety/interlock visibility

### Rule

Operator controls must call the existing authoritative session/control contract. No local fake runtime.

---

## 9. P4 — 3D MACHINE

### Read

- Buku Besar
- Work Order
- `ProcessMachine3D.tsx`
- `ProcessSimulator.tsx`
- CausalFrame
- hardware diagnostics
- relevant engine/session state

### Build

```text
REACTOR
  ↓
MATERIAL
  ↓
ULTRASONIC
  ↓
VAPOR / FLOW
  ↓
COLD TRAPS
  ↓
VACUUM PUMP
```

Visual animation must be driven by actual available state.

### Acceptance

Every meaningful visual state can be traced to a source field/frame.

---

## 10. P5 — INSTRUMENT

### Read

- CausalFrame
- session data
- current instrument components
- P1/P2 contracts

### Build

Where available:

- temperature
- pressure
- yield/output
- oil recovered
- water removed
- energy
- ultrasonic frequency
- ultrasonic power

Every displayed value must retain unit and identifiable frame/session provenance.

---

## 11. P6 — TREND

### Read

- CausalFrame
- replay contract
- existing chart implementation
- P5 metric contract

### Build

- synchronized process trends
- common time/step axis
- frame cursor
- selected-frame synchronization

Charts only render available data. They never generate missing data.

---

## 12. P7 — CAUSAL INSPECTOR

### Read

- CausalFrame implementation
- control loop
- safety/interlock data
- ProcessSimulator

### Build

```text
SENSOR BEFORE
      ↓
CONTROLLER / INTERLOCK
      ↓
INTENDED COMMAND
      ↓
EFFECTIVE COMMAND
      ↓
SYSTEM RESPONSE
      ↓
SENSOR AFTER
```

Purpose: answer **why a value changed**, not merely display that it changed.

---

## 13. P8 — TIMELINE

### Read

- event data
- CausalFrame
- session/replay contracts

### Build

- stage transitions
- alarms
- interlocks
- hardware events
- important process events
- event → frame selection

No invented events.

---

## 14. P9 — RECORDER / EVIDENCE

### Status

**AUDIT FIRST.**

### Read

- scientific recorder
- evidence export
- provenance implementation
- replay evidence
- tests

### Verify

- experiment identity
- session identity
- frame range
- provenance
- data boundary
- canonical serialization
- SHA-256/checksum
- reproducibility
- authorization

Only patch verified gaps. Do not rewrite working evidence infrastructure for cosmetic reasons.

---

## 15. P10 — REPLAY

### Status

**AUDIT FIRST.**

### Read

- `ExperimentReplay.tsx`
- CausalFrame
- session API
- evidence
- snapshot/restore
- `MachineDynamicsEngine`
- replay tests

### Verify

```text
FRAME N
  = MACHINE N
  = INSTRUMENT N
  = GRAPH N
  = CAUSAL N
  = TIMELINE N
```

Verify deterministic play/pause/step/reset and snapshot restore.

Do not create fallback frames to hide missing data.

---

## 16. P11 — STATE HANDLING

### Build

Explicit UI states:

- LOADING
- RUNNING
- PAUSED
- STOPPED
- COMPLETE
- FAULT
- UNKNOWN
- NO DATA
- SESSION EXPIRED
- API UNAVAILABLE
- SAFETY INTERLOCK
- UNSUPPORTED LEGACY DATA

`UNKNOWN` must not be rendered as zero or a plausible fake value.

---

## 17. P12 — RESPONSIVE / VISUAL QA

### Read

- P1 tokens
- P2 shell
- all integrated component contracts

### Verify

- 1920×1080
- 1440×900
- laptop
- tablet
- mobile

Check:

- clipping
- overlap
- overflow
- unreadable metrics
- broken hierarchy
- lost provenance
- lost safety state
- inconsistent spacing

P12 may report or patch only defects within its visual scope.

---

## 18. THREE REQUIRED RESULT CLASSES

The Control Room and final reports must preserve three separate knowledge outputs:

### A. TESTED / EVIDENCED

Supported by accepted evidence, especially validated laboratory evidence.

### B. ESTIMATED / POSSIBLE

Literature-derived, simulation-derived, model-fit, incomplete, or hypothetical information. Confidence/uncertainty must be visible.

### C. AI ANALYSIS

AI interpretation, pattern detection, contradictions, knowledge gaps, and recommended laboratory experiments.

These classes must never be merged into one undifferentiated result.

---

## 19. SAMPLE CONTEXT CONTRACT

When material data is available, preserve context that may affect reproducibility:

- species/variety
- plant part
- fresh/dry/frozen state
- moisture
- drying/freezing history
- geographic origin
- altitude
- cultivation conditions
- fertilizer/treatment
- harvest age/time
- batch/lot
- particle size
- storage conditions
- solvent
- extraction protocol

Two records with the same plant name are not automatically equivalent experiments.

---

## 20. COMMIT RULE

Each worker must produce an isolated commit.

Commit format:

```text
workstream(P1): master map and design tokens
workstream(P2): control room shell
workstream(P3): header navigation operator controls
...
```

Do not squash another worker's commit into your own unless explicitly requested by the integration owner.

---

## 21. REQUIRED WORKER REPORT

Every completed worker must report:

```text
IUVFES WORKSTREAM REPORT

WORKSTREAM:
STATUS: DONE / PARTIAL / BLOCKED

READ:
- ...

CHANGED:
- ...

NOT CHANGED:
- ...

DATA SOURCES:
- ...

SYNTHETIC DATA:
NONE / EXPLICITLY DOCUMENTED

DEPENDENCIES:
- ...

BLOCKERS:
- ...

TESTS:
- pnpm check
- pnpm test
- pnpm build

RESULT:
PASS / FAIL

COMMIT:
<sha>
```

---

## 22. INTEGRATION RULE

Workers may complete in any order.

Integration must happen through a controlled integration branch/checkpoint.

```text
P1 ─┐
P2 ─┤
P3 ─┤
P4 ─┤
P5 ─┤
P6 ─┤
P7 ─┤──→ INTEGRATION CHECKPOINT
P8 ─┤            ↓
P9 ─┤       DATA-FLOW AUDIT
P10─┤            ↓
P11─┤       VISUAL INTEGRATION
P12─┘            ↓
             REGRESSION
                 ↓
             BUILD
                 ↓
          GITHUB QUALITY GATE
```

Integration owner must resolve conflicts by contract, not by whichever implementation was committed last.

---

## 23. BLOCKER RULE

If a worker discovers a defect outside its scope:

```text
DO NOT PATCH
     ↓
IDENTIFY OWNER
     ↓
CREATE BLOCKER NOTE
     ↓
DESCRIBE EVIDENCE
     ↓
PROPOSE MINIMAL CONTRACT CHANGE
     ↓
WAIT FOR INTEGRATION DECISION
```

This rule prevents parallel work from becoming parallel uncontrolled refactoring.

---

## 24. FINAL INTEGRATION GATE

The Control Room cannot be declared complete until:

- all workstreams have a recorded status;
- all blockers are resolved or explicitly accepted;
- data flow is traceable from engine → CausalFrame → UI;
- no synthetic scientific telemetry is present;
- replay is deterministic or its limitation is explicitly documented;
- evidence/provenance is intact;
- three result classes remain separated;
- responsive/visual QA passes;
- `pnpm check` passes;
- `pnpm test` passes;
- `pnpm build` passes;
- GitHub Quality Gate passes;
- Buku Besar and work-map statuses are updated.

---

## 25. CURRENT EXECUTION STATUS

| Workstream | Status |
|---|---|
| P1 Master Map + Design Tokens | ⬜ |
| P2 Control Room Shell | ⬜ |
| P3 Header/Nav/Operator | ⬜ |
| P4 3D Machine | ⬜ |
| P5 Instrument | ⬜ |
| P6 Trend | ⬜ |
| P7 Causal Inspector | ⬜ |
| P8 Timeline | ⬜ |
| P9 Recorder/Evidence | 🟡 Audit |
| P10 Replay | 🟡 Audit |
| P11 State Handling | ⬜ |
| P12 Responsive/Visual QA | ⬜ |

This table is a coordination map, not permission to modify another workstream.

---

## 26. CHANGE MANAGEMENT

Any change to this contract must:

1. be justified;
2. identify affected workstreams;
3. preserve scientific boundaries;
4. update the Buku Besar/work map when architectural behavior changes;
5. be committed separately from ordinary component work when practical.

The contract is a living document, but changes must be explicit rather than silently inferred by workers.
