# Model Revision Validation Loop

IUVFES now connects material-model revisions to measured evidence through an explicit validation step.

```text
Material Model v1
      ↓
new validated evidence
      ↓
Material Model v2
      ↓
simulation
      ↓
compare with measured data
      ↓
explicit tolerance
      ↓
VALIDATED / NOT_VALIDATED / INSUFFICIENT_DATA
```

## Evidence rule

The validation layer does not invent tolerances. Each metric comparison must supply an explicit tolerance established by the study protocol, measurement capability, engineering requirement, or other documented basis.

The result retains model value, measured value, absolute error and tolerance for every metric.

## Interpretation

A revision that passes the configured comparisons is validated only for those metrics, data, operating conditions and tolerances. It does not prove universal validity, safety, causality, or accuracy outside the tested domain.

A failed comparison should trigger investigation rather than automatic parameter fitting. Possible causes include incorrect material properties, model-form error, measurement problems, unmodeled phenomena, or operating-condition mismatch.

## Continuous knowledge loop

```text
experiment
  ↓
new evidence
  ↓
material revision
  ↓
simulation
  ↓
measured-vs-simulated validation
  ↓
model confidence / failure analysis
  ↓
next experiment or controlled revision
```

Historical revisions and their validation reports remain immutable evidence for reproducibility.
