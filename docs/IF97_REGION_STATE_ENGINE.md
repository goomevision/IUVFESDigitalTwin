# IUVFES IF97 Region State Engine

The region selector is the routing layer between authoritative saturation/B23 boundary calculations and future IF97 property solvers.

## Supported routing logic

For ordinary IF97 states:

- 273.15 K <= T <= 623.15 K: Region 1 is selected on the liquid side of the saturation pressure; Region 2 on the vapor side; the saturation line is Region 4.
- 623.15 K < T <= 863.15 K: Region 2 is selected below the B23 pressure boundary; Region 3 above it.
- 863.15 K < T <= 1073.15 K and p <= 100 MPa: Region 2 routing is supported by the IF97 domain definition.

These domain rules follow IAPWS-IF97 R7-97(2012). IAPWS states that Region 2 is defined up to 623.15 K below the saturation curve, then up to 863.15 K below B23, and through 1073.15 K at pressures up to 100 MPa. The official release also states that IF97 is divided into regions represented by different fundamental equations.

## Important boundary rule

The selector does not calculate thermodynamic properties. A region being selected means only that the appropriate property formulation has been identified. It does not mean that density, enthalpy, entropy, internal energy, or heat capacity are available.

## Safety against false precision

- Missing saturation pressure => `DATA_GAP`.
- Missing B23 pressure when required => `DATA_GAP`.
- B23 boundary itself => explicit boundary handling rather than arbitrary Region 2/3 assignment.
- Outside ordinary domain => `OUT_OF_DOMAIN`.

## Next layer

Implement the Region 1 and Region 2 Gibbs-equation property evaluators, using the official coefficient tables and the official verification values from IAPWS-IF97. Promote each evaluator only after coefficient transcription, units, derivatives, domain checks, and reference-state tests pass.

Source: IAPWS R7-97(2012), Revised Release on the IAPWS Industrial Formulation 1997 for the Thermodynamic Properties of Water and Steam.
