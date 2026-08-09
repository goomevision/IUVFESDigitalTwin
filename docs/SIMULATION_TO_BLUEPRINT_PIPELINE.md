# Simulation → Blueprint Evidence Pipeline

IUVFES now defines a controlled bridge from a completed simulation run to engineering-design inputs.

## Pipeline

```text
Closed-loop simulation
        ↓
Simulation evidence envelope
        ↓
Acceptance criteria
        ↓
Safety-event review
        ↓
Design-input synthesis
        ↓
Engineering drawing package
        ↓
Independent engineering review
        ↓
Prototype / fabrication decision
```

## Design inputs that may be carried forward

The synthesis layer can carry simulation envelope values such as:

- peak absolute pressure;
- peak temperature;
- peak heating power;
- peak cooling power;
- pressure rate of change;
- temperature rate of change;
- simulation run identity;
- validation report identity;
- hardware-model version;
- dataset/material provenance;
- safety-event timeline.

These are **design inputs**, not automatic fabrication ratings.

## Blocking rules

Design synthesis is blocked when:

- the simulation lacks a run or validation identity;
- acceptance criteria are not satisfied;
- safety events remain unresolved;
- the pressure envelope is invalid;
- the temperature envelope is invalid.

## Critical engineering boundary

A simulated peak pressure must not be used as a fabricated vessel's allowable pressure without an independent pressure-vessel design calculation. Wall thickness, weld/joint efficiency, material allowable stress, corrosion allowance, relief protection, fatigue and applicable code requirements remain engineering responsibilities.

Likewise, simulated heater/cooling power is not a certified component rating. Electrical, thermal, mechanical and control-system verification remain required.

## Digital thread

The drawing package must retain:

`Simulation Run → Validation Report → Hardware Model → Dataset/Material → Design Revision → Drawing Sheet`.

This allows every drawing dimension or design condition that originated in simulation to be traced back to the evidence that produced it.
