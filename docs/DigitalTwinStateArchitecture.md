# IUVFES Digital Twin — State / Sensor / Actuator Architecture

## Purpose

The simulator now has a causal machine-state layer between the physics engine and the operator UI.

```text
Physics model
   ↓
Sensor frame
   ↓
ProcessStateEngine
   ├── interlocks
   ├── state transitions
   ├── alarms
   └── actuator commands
   ↓
Control-room telemetry
```

## Process lifecycle

1. PRE_FLIGHT — verify initial conditions.
2. CHARGE — acknowledge material loading.
3. VACUUM — run the vacuum pump until target pressure is achieved.
4. HEAT_UP — heater is enabled only after the vacuum interlock passes.
5. EXTRACTION — heater/extractor/condenser are enabled while the process model produces sensor frames.
6. CONDENSATION — recover vapor/condensate.
7. COOL_DOWN — bring the machine toward a safe handling temperature.
8. COMPLETE — publish final state.
9. FAULT — safety controller has tripped; active heating/extraction is disabled.

## Important fidelity rule

A UI progress percentage must never be the authority for a physical transition. A transition must be caused by sensor conditions or an explicit operator acknowledgement. The current engine implements this principle for pressure, temperature and safety interlocks.

## Next engineering layers

- actuator response models (pump curve, heater power, condenser duty, extractor load);
- sensor noise, lag and calibration offsets;
- valve states and chamber isolation;
- PID-like control loops;
- material-bed state and moisture gradients;
- vapor/condensate inventory;
- abnormal-event injection and recovery procedures;
- event journal for every state transition;
- 3D machine visualization driven by actuator state rather than animation progress;
- calibration mode comparing simulator telemetry with real machine logs.

This remains a simulation model, not a safety-certified industrial control system. Parameters must be validated against measured machine data before being used for operational decisions.
