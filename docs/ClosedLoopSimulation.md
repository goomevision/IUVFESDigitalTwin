# Causal Closed-Loop Simulation

## Purpose

IUVFES Digital Twin is being evolved from a result/playback simulator toward a causal process simulator. The simulator must expose the same logical sequence a real laboratory machine follows:

```text
Sensor state
    ↓
Process state / interlocks
    ↓
Controller
    ↓
Actuator commands
    ↓
Machine dynamics
    ↓
Next sensor state
    ↓
Journal / timeline
```

`server/closedLoopSimulation.ts` implements this coordinator as a deterministic simulation primitive.

## Process stages

The current state machine exposes:

- PRE_FLIGHT
- CHARGE
- VACUUM
- HEAT_UP
- EXTRACTION
- CONDENSATION
- COOL_DOWN
- COMPLETE
- FAULT

The process state engine remains responsible for stage transitions and safety interlocks. Machine dynamics are responsible for producing the next sensor state from actuator commands.

## Pause / resume / reset semantics

Pause is a simulation-state operation, not a UI playback operation:

- `pause()` prevents the next timestep from advancing.
- `resume()` continues from the exact stored sensor/state position.
- `reset()` returns the model to deterministic initial conditions and clears the causal frame journal.

## Causal frame

Each generated frame records:

1. sensor state before actuation;
2. controller/interlock state;
3. actuator commands;
4. sensor state after dynamics;
5. simulation timestamp and step number.

This makes it possible to reconstruct *why* the next machine state occurred instead of only showing the final result.

## Scientific boundary

This is a deterministic simulation architecture, not yet a validated industrial control model. Parameters must be calibrated and validated against laboratory measurements before outputs are used for scientific claims, equipment design, safety decisions, or published conclusions.

The next integration stage is to connect this coordinator to the existing simulation API and UI timeline, then persist every causal frame as immutable raw simulation data with provenance and checksums.
