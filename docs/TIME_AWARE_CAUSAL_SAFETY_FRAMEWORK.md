# IUVFES Time-Aware Causal Safety Framework

## Purpose

IUVFES interactive simulation is now designed to preserve process time instead of allowing the UI to advance the physical state arbitrarily fast.

The default interactive mode is `REAL_TIME`:

- one simulation `dtSeconds` must be backed by the same wall-clock duration;
- an early step request returns `waiting` and does not mutate the simulation state;
- each accepted frame records simulation time and wall-clock timing metadata;
- pause/resume and snapshot restore preserve the timing gate.

Offline `runToCompletion()` remains available for deterministic batch computation and intentionally bypasses wall-clock pacing. It must not be interpreted as a physical real-time run.

## Causal loop

```text
sensorBefore
    ↓
process state + interlocks
    ↓
controller
    ↓
actuator commands
    ↓
machine dynamics
    ↓
sensorAfter
    ↓
causal frame + event/provenance
    ↓
next time step
```

## Safety kernel

The safety kernel evaluates both absolute limits and rates of change:

- pressure minimum / maximum;
- temperature maximum;
- `dP/dt` pressure rate;
- `dT/dt` temperature rate.

A rate excursion is a `WARNING` transient by default. Absolute pressure or temperature limit violations are `CRITICAL` and trip the process state machine to `FAULT`.

These limits are **simulation safety envelopes**, not engineering certification limits. Real equipment must use validated vessel, valve, pump, heater, sensor, relief-device, and operating-envelope data.

## Why rate limits matter

A sudden sensor change can be scientifically important even when the new absolute value is still below a static threshold. Recording the transient allows IUVFES to detect, explain, replay, and compare abnormal process events.

## Data recorded per causal frame

- simulation step;
- simulation timestamp;
- wall-clock timestamp;
- wall-clock delta from the previous accepted step;
- sensor state before actuation;
- controller state and commands;
- sensor state after dynamics;
- safety/interlock state;
- alarms and transition reason through the process state.

## Safety principle

The simulator must never treat a visually plausible transition as proof that a real machine is safe. The Digital Twin is a model. Real-world use requires instrument calibration, validated process parameters, structural design limits, independent safety systems, and laboratory/engineering validation.
