# IUVFES CONTROL ROOM — P1 / P11 / P12 REMEDIATION

Branch: `audit/control-room-p1-p12-2026-08-12`
Baseline: `7da03f0746745ae5e3224270fe4eb8f4f406d753`

## Purpose

This document records the controlled remediation package for the three open workstreams identified by the P1–P12 audit.

## P1 — MASTER MAP + DESIGN TOKENS

### Current source of truth

The existing UI token source is `client/src/index.css`.

It already defines:

- typography: Inter / Space Mono;
- primary and semantic colors;
- dark background layers;
- foreground/muted/accent states;
- border and radius tokens;
- Tailwind theme aliases;
- shared glow/panel utilities.

Therefore P1 does **not** introduce a second design system.

### Required map

```text
SYSTEM HEADER
      |
      +-- OPERATOR / CONTROL RAIL
      |
      +-- PROCESS HERO / MACHINE
      |
      +-- INSTRUMENT STRIP
      |
      +-- TREND / ANALYTICS
      |
      +-- CAUSAL INSPECTOR
      |
      +-- EVENT TIMELINE
      |
      +-- RECORDER / EVIDENCE
      |
      +-- REPLAY
```

### Design vocabulary

| Token family | Source |
|---|---|
| Typography | `--font-sans`, `--font-mono` |
| Primary accent | `--primary`, `--accent`, `--neon-cyan` |
| Secondary accent | `--secondary`, `--neon-purple` |
| Safety/destructive | `--destructive`, `--neon-pink` |
| Positive | `--neon-green` |
| Warning | `--neon-gold` |
| Background | `--background`, `--bg-dark-*` |
| Border | `--border`, `--color-border` |
| Radius | `--radius`, theme radius aliases |

No worker should introduce a second token vocabulary.

## P11 — STATE HANDLING

Required state vocabulary:

```text
LOADING
READY
RUNNING
PAUSED
STOPPED
COMPLETE
FAULT
UNKNOWN
NO_DATA
SESSION_EXPIRED
API_UNAVAILABLE
SAFETY_INTERLOCK
UNSUPPORTED_LEGACY_DATA
REPLAY
```

Rules:

1. Missing scientific values remain `UNKNOWN` / `NOT AVAILABLE`.
2. Missing values must never become `0`, random values, or plausible fallback values.
3. Runtime state and scientific provenance are separate concepts.
4. `SIMULATION` remains simulation provenance.
5. Laboratory provenance must come from laboratory evidence.
6. UI status must not infer a scientific result that is absent from the frame.

### Remaining P11 implementation gate

The runtime state mapping must be wired to the authoritative session/CausalFrame state. This document does not authorize a local fake state machine.

## P12 — RESPONSIVE / VISUAL QA

Required viewport matrix:

| Target | Width | Height |
|---|---:|---:|
| Desktop | 1920 | 1080 |
| Desktop | 1440 | 900 |
| Laptop | 1366 | 768 |
| Tablet | 1024 | 768 |
| Mobile | 390 | 844 |
| Mobile | 412 | 915 |

### QA checklist

- [ ] no horizontal overflow;
- [ ] no panel overlap;
- [ ] no clipped scientific values;
- [ ] units remain visible;
- [ ] provenance labels remain visible;
- [ ] safety state remains visible;
- [ ] machine canvas remains usable;
- [ ] timeline remains scrollable;
- [ ] recorder remains accessible;
- [ ] replay controls remain accessible;
- [ ] operator controls remain reachable;
- [ ] no second visual language appears;
- [ ] no scientific value is synthesized for responsive layouts.

### Browser verification requirement

P12 cannot be marked `DONE` from TypeScript/build success alone. It requires browser verification at the viewport matrix above.

## Acceptance Status

### P1

`PARTIAL` — existing token foundation confirmed; master-map/documentation established. Full closure requires downstream consumption audit.

### P11

`PARTIAL` — state vocabulary and rules established; runtime wiring still requires implementation/test.

### P12

`OPEN` — QA matrix established; browser execution still required.

## Scientific Boundary

No scientific data, telemetry, laboratory result, simulation result, or fallback number is created by this remediation package.
