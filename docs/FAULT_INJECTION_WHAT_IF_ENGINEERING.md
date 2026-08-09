# IUVFES Fault Injection / What-if Engineering

## Purpose

This layer extends deterministic fault-injection analysis from virtual hardware into explicit sensor-observation and actuator-execution faults.

## Causal chain

```text
PHYSICAL PROCESS STATE
        |
        v
  SENSOR OBSERVATION
        |
        v
 INTERLOCK / CONTROLLER
        |
        v
 ACTUATOR EXECUTION
        |
        v
 HARDWARE DYNAMICS
        |
        +----> physicalSensorAfter
        |
        v
 observed sensorAfter
```

Every causal frame now distinguishes:

- `physicalSensorAfter` — virtual process result before observation fault;
- `sensorAfter` — what controller/safety logic observes;
- `intendedCommands` — controller request;
- `effectiveCommands` — command after actuator fault transformation.

## Hardware fault classes

| Fault | Simulation effect |
|---|---|
| `VACUUM_LEAK` | increases effective pressure-rise rate |
| `PUMP_CAPACITY_DEGRADATION` | reduces pump capacity |
| `HEATING_POWER_LOSS` | reduces heater power |
| `COOLING_POWER_LOSS` | reduces cooling power |
| `THERMAL_MASS_INCREASE` | increases effective thermal mass |
| `CHAMBER_VOLUME_INCREASE` | increases connected chamber volume |

## Sensor fault classes

| Fault | Observation effect |
|---|---|
| `PRESSURE_BIAS` | adds deterministic pressure-reading bias |
| `TEMPERATURE_BIAS` | adds deterministic temperature-reading bias |
| `PRESSURE_SCALE` | scales pressure observation |
| `TEMPERATURE_SCALE` | scales temperature observation |
| `PRESSURE_STUCK` | holds previous pressure observation |
| `TEMPERATURE_STUCK` | holds previous temperature observation |

## Actuator fault classes

| Fault | Execution effect |
|---|---|
| `VACUUM_PUMP_UNAVAILABLE` | prevents pump command execution |
| `HEATER_UNAVAILABLE` | prevents heater command execution |
| `COOLING_UNAVAILABLE` | prevents cooling command execution |
| `EXTRACTOR_UNAVAILABLE` | prevents extractor command execution |
| `CONDENSER_UNAVAILABLE` | prevents condenser command execution |

Severity is normalized to `0..1`. Transformations are deterministic and do not mutate baseline input objects.

## Snapshot integrity

The closed-loop snapshot includes the fault scenario and refuses restore when the configured fault scenario differs. This prevents a saved trajectory from being silently resumed under a different fault definition.

## Evidence discipline

A fault-injection result is **simulation evidence**. It must not be presented as evidence that a physical component will fail at the same threshold, rate, or sequence.

A useful engineering record should preserve:

1. base simulation configuration;
2. exact fault type and severity;
3. resulting hardware profile;
4. sensor/actuator fault scenario;
5. simulation/model version;
6. causal frames;
7. physical-versus-observed sensor distinction;
8. intended-versus-effective command distinction;
9. safety-event timeline;
10. summary metrics;
11. comparison against baseline;
12. provenance and validation status.

## Not yet modeled

The current layer does **not** claim to model:

- probabilistic sensor noise or intermittent failure;
- sensor calibration drift over time;
- valve-specific dynamics or partial-stroke behavior;
- controller software faults;
- physical fracture, weld failure, fatigue or material failure;
- certified relief-system behavior;
- experimentally calibrated failure distributions.

These remain separate engineering layers and require explicit assumptions, provenance and validation boundaries.

## Next extension

The next high-value layer is **fault propagation evidence and comparative analysis**: automatically compare baseline vs fault trajectories, identify first divergence, map the causal chain to safety events, and produce a deterministic what-if report without turning simulation outcomes into unverified physical claims.
