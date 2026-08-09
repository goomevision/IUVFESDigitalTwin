# IUVFES Virtual Hardware — Real-Time Process and Safety Model

## Purpose

IUVFES treats interactive simulation as a time-dependent process, not as a sequence of instantaneous state changes. The default interactive mode is wall-clock paced: a simulation step of `dtSeconds` cannot be advanced again until the corresponding wall-clock interval has elapsed.

This prevents the interactive model from silently skipping heating, cooling, evacuation, condensation, actuator lag, and other transient effects.

## Causal sequence

```text
SENSORS
  -> INTERLOCK / SAFETY
  -> CONTROLLER
  -> ACTUATOR COMMANDS
  -> HARDWARE DYNAMICS
  -> NEXT SENSOR FRAME
  -> INTERLOCK / SAFETY
```

The next state must be produced from the previous state and the elapsed simulation interval. Hardware parameters such as chamber volume, pump capacity, thermal mass, heating power, cooling power and leak rate influence the dynamics.

## Real-time mode

`realTime: true` is the default for interactive closed-loop simulation.

For `dtSeconds = 1`, the interactive engine requires approximately one second of wall-clock time between accepted steps. A call made too early returns no new frame and exposes a retry interval to the API layer.

`runToCompletion()` remains an explicit offline/batch path for deterministic computation and testing. It must not be interpreted as a physical-time demonstration.

## Transient events and alarms

Pressure and temperature are evaluated as both absolute values and rates of change. A sudden pressure or temperature transition is therefore treated as a distinct safety condition rather than being hidden by the final value alone.

Examples:

- pressure rate exceeds the configured simulation envelope;
- temperature rate exceeds the configured simulation envelope;
- pressure crosses the configured upper or lower boundary;
- temperature exceeds the configured maximum;
- vacuum target is reached while the pressure transient has not stabilized.

The process state exposes these conditions through interlocks and alarms. A transient warning is not equivalent to proof of physical failure; it is a simulation safety event requiring the configured control response and, for real equipment, engineering review.

## Vacuum/pressure design principle

A vacuum vessel must not be represented by a single internal-pressure thickness equation. The engineering model must retain:

- material and grade;
- geometry and unsupported span;
- shell diameter and length;
- wall thickness;
- external-pressure/vacuum design condition;
- temperature condition;
- weld/joint assumptions;
- reinforcement/opening effects;
- relief, venting and vacuum-breaker functions;
- applicable pressure-vessel design code;
- inspection and test evidence.

The current virtual hardware baseline deliberately marks unverified geometry and structural values as engineering inputs rather than certified values.

## Design-space simulation

The purpose of the virtual hardware layer is to allow controlled changes to hardware assumptions before physical construction:

```text
CHANGE HARDWARE PARAMETER
        -> RUN SIMULATION
        -> OBSERVE PRESSURE / TEMPERATURE / ENERGY
        -> CHECK TRANSIENTS / INTERLOCKS
        -> COMPARE DESIGN OPTIONS
        -> IDENTIFY RISK / UNCERTAINTY
        -> ENGINEERING REVIEW
```

A simulation result can identify a design that deserves further engineering analysis. It does not by itself certify that a physical vessel, heater, pump, valve or safety system is safe to manufacture or operate.

## Evidence boundary

The system must distinguish:

`BASELINE -> ASSUMED -> DATASHEET_REQUIRED -> CALCULATED -> MEASURED -> VALIDATED`

Only measured/calculated/validated evidence supported by appropriate engineering documentation should be promoted toward a physical design decision.

## Future extensions

1. physical geometry and mesh/structural model;
2. pressure-vessel external-pressure stability calculation;
3. thermal mass from actual component/material data;
4. pump curves and system conductance;
5. valve Cv and response characteristics;
6. sensor accuracy, response time and calibration chain;
7. uncertainty propagation;
8. fault injection and emergency-trip scenarios;
9. predicted-vs-actual validation against instrument data;
10. immutable evidence and reproducible engineering reports.

> Safety-critical physical equipment remains subject to qualified engineering, applicable codes, inspection/testing and commissioning. IUVFES is the simulation and evidence layer, not a substitute for those controls.
