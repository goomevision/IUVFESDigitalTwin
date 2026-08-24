# Causal Frame Visual Synchronization Gate

## Purpose

The process animation, numerical instruments, engine progress, actuator indicators, and sensor results must represent the **same `CausalFrame`**. A visual change alone is not evidence of synchronization.

## Authoritative frame fields

A rendered process frame is considered synchronized only when these values originate from the same frame:

- `step`
- `timestampSeconds`
- `controllerAfterActuation`
- `actuatorLevels`
- `effectiveCommands`
- `sensorAfter`
- `materialInventory`
- `safety`
- `ultrasonic`
- `hardwareDiagnostics`

The closed-loop engine already carries these values together in `CausalFrame`.

## Required UI rule

The UI must not derive process animation time from `requestAnimationFrame`, wall-clock time, or an independent counter. Rendering may interpolate between frames for smoothness, but the authoritative state must remain tied to the selected/current `CausalFrame.timestampSeconds`.

## Actuator rule

Boolean command state is insufficient for intensity. Visual intensity must use the continuous `actuatorLevels` values from the same frame. Examples:

- heater glow -> `actuatorLevels.heater`
- vacuum rotor/flow -> `actuatorLevels.vacuumPump`
- condenser flow -> `actuatorLevels.condenser`
- cooling flow -> `actuatorLevels.cooling`
- extraction activity -> `actuatorLevels.extractor`

`effectiveCommands` remains the authoritative ON/OFF/interlock state.

## Sensor rule

Displayed temperature, pressure, material mass, cold-trap values, ultrasonic values, and safety state must be read from the same frame used by the animation.

## Validation gate

A synchronization test must verify:

1. `sensorAfter === physicalSensorAfter` for the exposed post-actuation sensor snapshot.
2. `controllerAfterActuation.sensors === sensorAfter`.
3. `safety.stage === controllerAfterActuation.stage`.
4. The frame timestamp advances by the configured simulation `dtSeconds`.
5. `actuatorLevels` and `effectiveCommands` are present in the frame.
6. No wall-clock timestamp is used as the simulation timestamp.

## Scientific scope boundary

Passing this gate proves **causal UI synchronization**, not a complete thermodynamic energy balance. Energy closure remains a separate physics-validation gate.
