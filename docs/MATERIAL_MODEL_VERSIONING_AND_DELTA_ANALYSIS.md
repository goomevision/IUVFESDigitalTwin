# Material Model Versioning and Delta Analysis

IUVFES now preserves material-model history and can compare simulation outputs between revisions.

## Revision rule

A new validated discovery/property set creates a new immutable material-model revision:

```text
v1 → new evidence → v2 → new evidence → v3
```

Historical revisions are not rewritten.

## Simulation comparison

A simulation result records the material revision used. When the same study is rerun with a later material revision, the comparison layer can report metric deltas:

- absolute delta;
- relative delta when the original value is non-zero;
- metric name and unit;
- source material revision IDs.

Example:

```text
v1 evaporated mass = 2.0 kg
v2 evaporated mass = 2.5 kg
absolute delta      = +0.5 kg
relative delta      = +25%
```

The delta is an observation about two model runs. It is not itself proof that the newer model is physically more accurate.

## Scientific interpretation

A model revision should be evaluated against independent experimental evidence. The workflow is:

```text
new evidence
  ↓
material revision
  ↓
rerun simulation
  ↓
compare outputs
  ↓
compare against measured data
  ↓
validation decision
```

This allows IUVFES to quantify how much newly discovered material knowledge changes its predictions without losing reproducibility of earlier studies.
