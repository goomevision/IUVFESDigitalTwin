# IUVFES Safety Event Timeline

## Purpose

The safety event timeline converts per-frame simulation safety evidence into an auditable sequence of abnormal events, recoveries, and process faults.

## Event lifecycle

```text
Sensor Before
  -> Controller
  -> Dynamics
  -> Sensor After
  -> Safety Evaluation
  -> Event Detection
  -> Timeline
  -> Replay / Dataset / Validation Report
```

## Event types

- `PRESSURE_TRANSIENT`
- `TEMPERATURE_TRANSIENT`
- `OVER_PRESSURE`
- `UNDER_PRESSURE`
- `OVER_TEMPERATURE`
- `SAFETY_RECOVERY`
- `PROCESS_FAULT`

Each event retains the simulation step, simulation timestamp, optional wall-clock timestamp, sensor values, rate-of-change evidence, severity and alarm text.

## Interpretation boundary

This timeline is simulation evidence. It is not a certified industrial alarm system, SIS, relief-system design, or proof that a physical vessel is safe. Physical protection must use independently engineered limits, instrumentation, interlocks and applicable codes.

## Scientific use

The event timeline is intended to make abnormal behavior reproducible and reviewable. It can be attached to Experiment Replay, scientific dataset manifests, failure analysis and validation reports without modifying the immutable raw evidence.
