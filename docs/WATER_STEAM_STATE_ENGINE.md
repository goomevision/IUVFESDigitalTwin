# IUVFES Water/Steam State Engine

## Purpose

Provide one controlled entry point for water/steam state routing inside IUVFES. The engine combines the IF97 region selector, phase-aware boundary and authoritative property adapter.

## Current behavior

The engine can route a valid `(T_abs, P_abs)` state to the appropriate IF97 region when the selector has sufficient information. It does not fabricate thermodynamic properties.

Therefore a successfully selected Region 1 or Region 2 can still return `DATA_GAP` until the corresponding property adapter is connected and reference-tested in the production path.

## State contract

```text
T_abs + P_abs
      |
      v
input validation
      |
      +--> phase-aware boundary
      |
      +--> IF97 region selector
      |
      +--> authoritative property adapter
      |
      v
WaterSteamState
```

Every state carries provenance identifying `IAPWS_IF97`, the selector, and property adapter.

## Safety/scientific rule

`ROUTED` must never be interpreted as `VALIDATED`. A region selection only identifies the governing property formulation. Validation requires reference-state agreement and, for process use, calibration/experimental evidence.

## Next promotion gate

1. connect Region 1 property implementation;
2. connect Region 2 property implementation;
3. connect Region 4 saturation properties;
4. implement Region 3 property path;
5. add reference-state matrix tests;
6. add boundary and out-of-domain tests;
7. expose property provenance and numerical tolerances;
8. only then allow the process-physics solver to consume thermodynamic properties.
