# IAPWS-IF97 Region Boundary — B23

IUVFES now implements the IAPWS-IF97 Region 2/3 boundary equation using the coefficients published in R7-97(2012), Table 1.

## Implemented

`if97B23Pressure(T)` evaluates the B23 pressure boundary for:

- absolute temperature `623.15 K <= T <= 863.15 K`;
- pressure returned in MPa.

The inverse helper returns the boundary temperature for a pressure when a unique root exists inside the published temperature domain.

## Verification

The IAPWS verification point is:

- `T = 623.15 K`
- `p = 16.5291643 MPa`

The automated test checks this point and the inverse calculation.

## Important limitation

B23 is only one boundary of the complete IF97 region-selection problem. This implementation does **not** yet claim full Region 1/2/3/4/5 classification or property evaluation.

The next promotion step requires:

1. Region 4 saturation-pressure equation;
2. Region 1/2/3 fundamental equations;
3. Region 5 equation;
4. complete domain checks;
5. boundary consistency tests;
6. property reference-state tests.

Until those are present, the IAPWS adapter must remain conservative and may return `DATA_GAP`.
