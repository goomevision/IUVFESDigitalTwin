# IAPWS-IF97 Property Adapter

## Purpose

Provide one authoritative boundary for water/steam thermodynamic properties used by the IUVFES process-physics engine.

## Contract

Input:

- absolute temperature in kelvin;
- absolute pressure in MPa.

Output, only after a verified IF97 implementation is connected:

- IF97 region;
- phase/state;
- density or specific volume;
- specific enthalpy;
- specific internal energy;
- entropy;
- heat capacity where supported;
- provenance/version of the property implementation.

## Current state

The adapter currently returns `DATA_GAP` for valid numeric states. This is intentional. It prevents a guessed equation, simplified saturation curve, or undocumented correlation from entering a safety-relevant simulation path.

## Promotion gate

The adapter may move from `DATA_GAP` to an operational state only after:

1. the IF97 region-selection implementation is connected;
2. saturation boundary handling is implemented;
3. reference states in `thermodynamicReferenceStates.ts` pass tolerance-based tests;
4. unit conversions are tested;
5. out-of-domain states are rejected;
6. phase transitions are explicitly represented;
7. provenance identifies the IF97 release and implementation version.

## Process integration

```text
T_abs + P_abs
      ↓
IF97 region selection
      ↓
property evaluation
      ↓
phase/state
      ↓
energy + mass + pressure models
      ↓
time-step solver
      ↓
sensor / safety layer
```

No AI-generated value may bypass this adapter for a scientific or safety-relevant water/steam calculation.
