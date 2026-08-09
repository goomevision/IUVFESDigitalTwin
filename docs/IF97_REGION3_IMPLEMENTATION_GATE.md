# IF97 Region 3 Implementation Gate

Region 3 is the dense-fluid/supercritical part of IAPWS-IF97 and uses a Helmholtz-energy formulation with multiple subregions and backward equations. IUVFES must not treat a simple T-P envelope as a complete Region 3 property solver.

## Current stage

`if97Region3Boundary.ts` only recognizes candidate Region 3 states and deliberately returns a `DATA_GAP` note for property evaluation.

## Promotion requirements

Before Region 3 can feed the process physics engine:

1. connect the authoritative Region 3 Helmholtz coefficients;
2. implement subregion selection;
3. implement the required derivative set;
4. implement density/root solving where the independent variables require it;
5. add official IAPWS verification points;
6. add continuity checks at Region 2/3 and Region 3/4 boundaries;
7. reject states outside the official domain;
8. attach implementation/version provenance.

## Safety rule

A Region 3 routing result is not a physical property result. Until the promotion gate is satisfied, the state must remain `DATA_GAP` for thermodynamic properties.

## Why this matters for IUVFES

The Region 3 area includes high-pressure and near-critical states. Errors here can propagate into pressure, energy, density and safety calculations. Therefore the conservative gate is intentional.
