# IUVFES Fault Injection / What-if Engineering

This layer extends deterministic fault-injection analysis from virtual hardware into explicit sensor-observation and actuator-execution faults.

## Causal chain

```text
PHYSICAL PROCESS STATE -> SENSOR OBSERVATION -> INTERLOCK / CONTROLLER
        -> ACTUATOR EXECUTION -> HARDWARE DYNAMICS -> physicalSensorAfter
        -> observed sensorAfter
```

Every causal frame distinguishes `physicalSensorAfter`, `sensorAfter`, `intendedCommands`, and `effectiveCommands`.

## Hardware faults

`VACUUM_LEAK`, `PUMP_CAPACITY_DEGRADATION`, `HEATING_POWER_LOSS`, `COOLING_POWER_LOSS`, `THERMAL_MASS_INCREASE`, `CHAMBER_VOLUME_INCREASE`.

## Sensor faults

`PRESSURE_BIAS`, `TEMPERATURE_BIAS`, `PRESSURE_SCALE`, `TEMPERATURE_SCALE`, `PRESSURE_STUCK`, `TEMPERATURE_STUCK`.

## Actuator faults

`VACUUM_PUMP_UNAVAILABLE`, `HEATER_UNAVAILABLE`, `COOLING_UNAVAILABLE`, `EXTRACTOR_UNAVAILABLE`, `CONDENSER_UNAVAILABLE`.

Severity is normalized to `0..1`. Transformations are deterministic and do not mutate baseline input objects.

## Snapshot integrity

The closed-loop snapshot includes the fault scenario and refuses restore when the configured fault scenario differs.

## Evidence discipline

A fault-injection result is **simulation evidence**. It must not be presented as evidence that a physical component will fail at the same threshold, rate, or sequence. Preserve the base configuration, exact fault definition, resulting hardware profile, model version, causal frames, physical-versus-observed sensor distinction, intended-versus-effective commands, safety-event timeline, metrics, baseline comparison, provenance and validation status.

## Not yet modeled

The current layer does not claim probabilistic sensor noise, intermittent failure, calibration drift, valve-specific dynamics, controller software faults, physical fracture/weld/fatigue/material failure, certified relief-system behavior, or experimentally calibrated failure distributions.

## Next extension

Automatically compare baseline vs fault trajectories, identify first divergence, map the causal chain to safety events, and produce a deterministic what-if report without turning simulation outcomes into unverified physical claims.
