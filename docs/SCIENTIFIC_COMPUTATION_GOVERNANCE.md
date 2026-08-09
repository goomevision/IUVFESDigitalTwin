# IUVFES Scientific Computation Governance

## Objective

IUVFES must produce simulations that are traceable to evidence-backed material data and explicitly documented governing equations. Numerical output is not treated as scientific truth merely because a calculation completed successfully.

## Model hierarchy

```text
Literature / standards / measured evidence
                ↓
       Material property model
                ↓
       Governing equations
                ↓
        Numerical integration
                ↓
        Sensor / actuator model
                ↓
          Safety kernel
                ↓
          Simulation result
                ↓
       Comparison / validation
```

## Required metadata for every physical model

- model ID and version;
- equation IDs;
- variables and SI units;
- assumptions;
- applicable temperature/pressure/state domain;
- material-property source IDs;
- numerical method and time step;
- boundary and initial conditions;
- uncertainty or sensitivity information where available;
- validation status.

## Rules

1. Missing material properties remain `DATA_GAP`.
2. Extrapolation outside an evidence-backed property range is rejected unless explicitly enabled and labelled as an engineering approximation.
3. A simulation result is not a validation result.
4. Literature values are priors/evidence, not IUVFES measurements.
5. Every safety-relevant calculation must use absolute pressure and absolute temperature where required by the governing equation.
6. Phase changes must use a phase-aware property/model path; sensible-heat equations must not silently cross a phase boundary.
7. Time integration must preserve process chronology. The simulator must not teleport state variables between distant physical states without recording the transition and model used.
8. Conservation residuals (mass and energy where applicable) must be reported as diagnostics.
9. If an equation's assumptions are not satisfied, the model status must become `INCONCLUSIVE` or `DATA_GAP`, not `PASS`.
10. AI may select, explain, compare, or propose models, but may not silently invent physical constants or alter governing equations.

## Initial equation registry

The repository currently records auditable reference equations for:

- sensible heating: `Q = m Cp ΔT`;
- transient lumped energy balance;
- mass conservation;
- first-law control-volume energy balance;
- ideal-gas state relation;
- Fourier conduction.

These equations are initially registered as `REFERENCE_ONLY`. They must be promoted to `IMPLEMENTED` only after a corresponding process model, units, numerical method, domain checks, and tests are implemented.

## Validation ladder

```text
REFERENCE
   ↓
IMPLEMENTED
   ↓
UNIT TESTED
   ↓
CONSERVATION CHECKED
   ↓
BENCHMARKED
   ↓
CALIBRATED
   ↓
EXPERIMENTALLY VALIDATED
```

No level may be skipped by an AI-generated claim.
