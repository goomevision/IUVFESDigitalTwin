# IAPWS-IF97 Region 2 Implementation

IUVFES now contains the basic Region 2 Gibbs formulation for water/steam.

## Source

IAPWS R7-97(2012), Sections 6.1 and Tables 10-12.

The formulation uses:

- `gamma = gamma0 + gammaR`;
- `pi = p / 1 MPa`;
- `tau = 540 K / T`;
- ideal-gas part with `ln(pi)` and 9 terms;
- residual part with 43 terms in `pi^I (tau - 0.5)^J`.

## Properties implemented

- specific volume;
- enthalpy;
- internal energy;
- entropy;
- isobaric heat capacity.

## Verification

The test suite uses the three Region 2 verification states published by IAPWS:

1. `T=300 K, p=0.0035 MPa`;
2. `T=700 K, p=0.0035 MPa`;
3. `T=700 K, p=30 MPa`.

The implementation must match the published values within explicit numerical tolerances before it is promoted into the production process-physics path.

## Domain rule

Region 2 is not simply `T > 623.15 K`. The applicable pressure boundary depends on the saturation curve for lower temperatures and the B23 boundary for the 623.15-863.15 K interval. Region selection must therefore remain upstream of this property solver.

## Scientific status

This file implements the basic Region 2 equation and reference tests. It does not by itself establish experimental validation of an IUVFES physical process. It must be combined with the region selector, saturation boundary, conservation checks, and laboratory calibration before safety-relevant conclusions are permitted.
