# Material / Process Physics Layer

The Digital Twin now has a material-inventory layer between machine telemetry and final recovery results.

## Causal flow

```text
Machine sensors
   ↓
pressure + temperature + actuator fractions
   ↓
MaterialProcessEngine
   ├── moisture in matrix
   ├── vapor inventory
   ├── condensate water
   ├── oil in matrix
   ├── oil vapor
   ├── recovered oil
   └── volatile loss
```

## What changes during a timestep

### 1. Evaporation

Moisture removal depends on:

- chamber pressure;
- material temperature;
- heater power;
- vacuum power;
- remaining moisture inventory.

### 2. Extraction

Oil leaves the material matrix according to:

- temperature;
- vacuum level;
- extractor command;
- remaining oil inventory.

### 3. Condensation

Water and oil vapor are transferred into recovered streams according to condenser/cooling availability and a configurable condenser efficiency.

### 4. Mass tracking

The engine explicitly tracks:

- solid matrix;
- residual moisture;
- vapor;
- condensate water;
- oil remaining in the matrix;
- oil vapor;
- recovered oil;
- volatile loss.

This allows the UI to display a process rather than simply interpolate a final yield number.

## Engineering status

This is a deterministic simulation layer intended for Digital Twin development and UI/control validation. Coefficients are placeholders until calibrated against measured machine data. It must not be treated as an operational recipe or safety-certified process model.

## Next integration

The next integration step is to feed `MaterialProcessEngine` from the same actuator commands produced by `ProcessStateEngine` and expose its inventory in every real-time simulation frame. That will make the 3D machine, gauges, material balance and process timeline share one causal state.
