# Phase-Aware Thermodynamics

IUVFES must not treat water/steam as a single sensible-heating material across phase boundaries.

## Current implementation

`server/phaseAwareThermodynamics.ts` provides a conservative boundary API. It intentionally returns `DATA_GAP` until an authoritative saturation-property implementation is connected.

This is safer than embedding an approximate boiling curve that could silently produce an incorrect phase or latent-heat calculation.

## Required production path

```text
T + absolute P
      ↓
IAPWS saturation / property resolver
      ↓
phase determination
      ↓
state properties (h, u, rho, Cp, etc.)
      ↓
phase-aware energy balance
      ↓
transient process solver
```

## Required phases

- liquid;
- vapor;
- two-phase;
- saturated liquid;
- saturated vapor;
- superheated vapor;
- subcooled/compressed liquid, where supported.

## Safety rule

A sensible-heat equation such as `Q = m Cp ΔT` must not silently cross a verified phase boundary. Latent heat and phase-dependent properties require a phase-aware thermodynamic model.

## Pressure convention

All thermodynamic calculations must distinguish absolute pressure from gauge pressure. Absolute pressure is required for equations of state and steam-property lookup.

## Next implementation step

Connect an authoritative IAPWS property/saturation implementation, then add benchmark tests against published reference states before promoting the adapter from `DATA_GAP` to `IMPLEMENTED`.
