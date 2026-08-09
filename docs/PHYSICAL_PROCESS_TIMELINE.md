# Physical Process Timeline

IUVFES now defines a simulation layer in which operator commands, actuator/model response, physical time, process state and transient warnings are recorded separately.

## Core rule

> Accelerate computation, never accelerate physics.

The simulator may advance physical time faster than wall-clock time, but every sample retains its `physicalTimeS`. Computational step duration is recorded separately as `computationStepS`.

## State versus command

An operator target is not the physical state. The command is passed to the authoritative dynamics model, which produces the next physical state. This prevents a setpoint such as `100 °C` from teleporting the vessel state from `10 °C` to `100 °C`.

The timeline records:

- operator command;
- target/setpoint;
- actual temperature, pressure, mass and energy;
- rates of change;
- physical timestamp;
- computation step;
- warnings;
- limit events.

## Adaptive time step

The timeline reduces its computational timestep when configured temperature or pressure-rate limits are exceeded. When the system is sufficiently slow relative to configured limits, it may increase the timestep.

This is a computational strategy. The recorded physical time is never replaced by wall-clock time.

## Safety boundary

A warning or limit event is evidence that a configured constraint was crossed; it is not a substitute for pressure-vessel code compliance, structural analysis, relief-system design, or competent engineering approval.

## Required downstream integration

Every simulation result should retain this timeline as provenance for:

```text
Study
  → Evidence
  → Validation
  → Engineering Design
  → Journal
  → Reproducibility Package
```

Future physics implementations must connect the `ProcessDynamics` callback to authoritative heat transfer, mass transfer, phase equilibrium, pressure/vacuum and material-property models. The timeline layer itself intentionally does not invent those physical laws.
