# IUVFES Validation Engine

The validation engine converts a measured-vs-simulated comparison into an explicit, auditable validation result.

## Acceptance criteria

Each metric must define, before interpreting the result where practical:

- metric name;
- unit;
- maximum mean absolute error;
- maximum absolute error;
- minimum number of compared points;
- optional measured uncertainty.

## Outcomes

`VALIDATED` — all configured error and data-volume criteria pass.

`PARTIALLY_VALIDATED` — at least one configured criterion passes, but another fails, or the evidence volume is insufficient for the requested gate.

`NOT_VALIDATED` — both configured error criteria fail.

`INSUFFICIENT_DATA` — no comparison points are available.

## Important boundary

A numerical validation result is valid only for the metric, operating regime, data, acceptance criteria and model version that were tested. It does not establish universal model validity, causality, instrument accuracy, safety, or suitability outside the tested domain.

Measured uncertainty is recorded as an input to the gate, but the current implementation does not yet propagate uncertainty into a confidence interval or statistical hypothesis test. That is a planned extension.

## Evidence chain

```text
Measured Data
    +
Simulation Data
    +
Comparison Metrics
    +
Acceptance Criteria
    ↓
Validation Engine
    ↓
Auditable Status + Reasons
    ↓
Study Evidence
    ↓
Journal / Engineering / Reproducibility
```

The validation status must retain the exact model version, dataset versions, experiment IDs, and acceptance criteria used to produce it.
