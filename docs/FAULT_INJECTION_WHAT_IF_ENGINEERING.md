# IUVFES Fault Injection / What-if Engineering

## Purpose

This layer turns the existing causal closed-loop simulator into a deterministic comparison environment for engineering what-if studies.

The system can now run a baseline and one or more injected-fault scenarios through the **same** `ClosedLoopSimulationEngine`, then retain the complete simulation result and a compact metric summary for comparison.

## Current fault classes

| Fault | Simulation effect | Engineering meaning |
|---|---|---|
| `VACUUM_LEAK` | increases effective pressure-rise rate | leak sensitivity study |
| `PUMP_CAPACITY_DEGRADATION` | reduces pump capacity | degraded evacuation performance |
| `HEATING_POWER_LOSS` | reduces available heater power | insufficient heating capacity |
| `COOLING_POWER_LOSS` | reduces available cooling power | cooling degradation |
| `THERMAL_MASS_INCREASE` | increases effective thermal mass | slower thermal response |
| `CHAMBER_VOLUME_INCREASE` | increases connected chamber volume | slower evacuation response |

Severity is normalized to `0..1`. Fault transformations are deterministic and do not mutate the baseline hardware profile.

## Causal boundary

The current implementation injects faults into the **virtual hardware dynamics profile** before the closed-loop run. Therefore the fault changes the same pressure/thermal dynamics used by the simulator.

It does **not yet** claim to model:

- real sensor bias or drift;
- sensor failure or response degradation;
- valve-specific mechanical failure;
- controller software failure;
- physical fracture, weld failure or material failure;
- certified relief-system behavior.

Those require additional causal hooks and/or physical evidence and remain explicit future layers rather than being simulated implicitly.

## Campaign flow

```text
BASELINE CONFIG
      |
      +------------------------------+
      |                              |
      v                              v
NO FAULT                       FAULT SCENARIO
      |                              |
      +-----------> CLOSED LOOP <----+
                         |
                         v
                 CAUSAL FRAMES
                         |
                         +--> SAFETY EVENTS
                         |
                         +--> METRICS
                         |
                         v
                 DESIGN COMPARISON
```

## Evidence discipline

A fault-injection result is **simulation evidence**. It must not be presented as evidence that a physical machine will fail at the same threshold or rate.

A useful engineering record should preserve:

1. base simulation configuration;
2. exact fault type and severity;
3. resulting hardware profile;
4. simulation/model version;
5. causal frames;
6. safety-event timeline;
7. summary metrics;
8. comparison against baseline;
9. provenance and validation status.

The broader IUVFES scientific architecture requires raw evidence to remain traceable and derived results to remain explicitly distinguishable from measured data. See the scientific-data infrastructure document and the existing safety-event timeline model.

## Next engineering layer

The next extension should add **causal sensor and actuator fault hooks** so a scenario can distinguish:

```text
PHYSICAL FAULT
    |
    +--> PROCESS DYNAMICS
    |
    +--> SENSOR OBSERVATION
    |
    +--> CONTROLLER RESPONSE
    |
    +--> ACTUATOR RESPONSE
    |
    +--> SAFETY KERNEL
```

That extension should preserve the current rule: no fault mode is considered physically validated until supported by measured behavior, equipment documentation, calibration records or appropriate engineering tests.
