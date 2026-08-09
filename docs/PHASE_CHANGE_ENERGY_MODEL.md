# Phase-Change Energy Model

This module adds the energy-accounting layer for explicit liquid-vapor phase change.

## Equation

For a supplied latent heat `h_fg` and vapor-quality change `Δx`:

`ΔE_latent = m × h_fg × Δx`

with the sign convention:

- evaporation: positive energy into the phase-change process;
- condensation: negative energy from the process.

## Important boundary

This module does **not** calculate `h_fg`, saturation pressure, saturation temperature, or vapor quality from T/P. Those quantities must come from the authoritative water/steam property layer.

Therefore this model cannot silently turn a heating curve into an evaporation prediction.

## Integration target

```text
T_abs + P_abs
      ↓
IAPWS state / saturation properties
      ↓
phase + h_fg + quality
      ↓
phase-change energy
      ↓
process energy balance
      ↓
transient pressure/temperature state
```

## Safety rule

A phase-change event must be represented as a state transition with time and energy accounting. A sudden change in quality without a corresponding physical transition is a simulation anomaly and should be surfaced to the safety layer.
