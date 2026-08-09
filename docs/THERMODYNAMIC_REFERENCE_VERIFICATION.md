# Thermodynamic Reference Verification

IUVFES uses IAPWS-IF97 as the authoritative reference for ordinary water/steam industrial thermodynamic properties. IAPWS states that IF97 is intended for industrial use and covers liquid/vapor equilibrium through its region and saturation formulations. citeturn0search0

## Verification contract

Before promoting the water thermodynamic adapter to `IMPLEMENTED`, it must be checked against authoritative IAPWS reference states for:

- saturation near atmospheric pressure;
- compressed/subcooled liquid;
- superheated vapor;
- region boundaries;
- property continuity/consistency at supported boundaries.

The repository currently stores these cases as test-contract metadata in `thermodynamicReferenceStates.ts`. The contract does not claim that the numerical property solver is implemented yet.

## Required properties

At minimum, the production adapter should expose, when valid for the requested state:

- pressure;
- temperature;
- specific volume / density;
- enthalpy;
- entropy;
- internal energy;
- heat capacity where supported;
- phase/region;
- saturation properties where applicable.

IAPWS-IF97 supports calculation of density/specific volume, sound speed, heat capacity, enthalpy, entropy and other properties from its regional formulations. citeturn0search0

## Numerical integrity

Each lookup must record:

```text
formulation = IAPWS-IF97
region
input variables
units
validity domain
solver/interpolation method
reference-test status
```

Out-of-domain requests must return `OUT_OF_DOMAIN`/`DATA_GAP`, never an unlabelled extrapolation.
