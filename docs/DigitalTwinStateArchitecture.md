# IUVFES Digital Twin — State / Sensor / Actuator Architecture

## Purpose

The simulator now couples the physics model to a causal machine-state layer. Physics frames provide the process demand/reference, while actuator commands modify the next sensor state before the controller evaluates the next transition.

```text
Physics model / reference frame
          ↓
MachineDynamicsEngine
          ↑
 actuator commands
          ↑
ProcessStateEngine
 ├── sensors
 ├── interlocks
 ├── state transitions
 └── alarms
          ↓
Control-room telemetry
```

## Process lifecycle

1. PRE_FLIGHT — verify initial conditions.
2. CHARGE — acknowledge material loading.
3. VACUUM — run the vacuum pump until target pressure is achieved.
4. HEAT_UP — heater is enabled only after the vacuum interlock passes.
5. EXTRACTION — heater/extractor/condenser are enabled while the coupled dynamics evolve.
6. CONDENSATION — recover vapor/condensate.
7. COOL_DOWN — bring the chamber toward a safe handling temperature.
8. COMPLETE — publish final state.
9. FAULT — safety controller has tripped; active heating/extraction is disabled.

## Dynamic actuator behavior

The current machine dynamics model includes:

- vacuum-pump pressure response;
- heater temperature ramp;
- passive thermal loss;
- condenser cooling contribution;
- active cooling response;
- extractor-dependent recovery drive;
- actuator lag;
- cumulative energy demand.

These are deterministic simulation parameters, not calibrated machine specifications.

## Important fidelity rule

A UI progress percentage must never be the authority for a physical transition. A transition must be caused by sensor conditions or an explicit operator acknowledgement. Actuator commands must influence subsequent sensor frames.

## Next engineering layers

- calibrated pump curves and valve coefficients;
- sensor noise, lag and calibration offsets;
- explicit valve states and chamber isolation;
- PID-like control loops;
- material-bed moisture and temperature gradients;
- vapor/condensate inventory;
- abnormal-event injection and recovery procedures;
- event journal for every state transition;
- 3D machine visualization driven by actuator state rather than animation progress;
- calibration mode comparing simulator telemetry with real machine logs.

This remains a simulation model, not a safety-certified industrial control system. Parameters must be validated against measured machine data before being used for operational decisions.
