# Evidence Quality and Uncertainty Gate

IUVFES now has a conservative screening layer before experimental evidence is used for model promotion.

## Checks

- finite numeric values;
- explicit measurement uncertainty;
- non-negative uncertainty;
- consistent units within an analysis set;
- statistical outlier candidates when enough repeated observations exist.

An outlier is only a **candidate for review**. The system never deletes, clips, replaces, or silently averages an observation because it was flagged.

## Unit policy

Mixed units are rejected at this boundary until an explicit conversion step is performed. Unknown or ambiguous units must remain unresolved rather than being guessed.

## Quality states

```text
READY
REVIEW_REQUIRED
```

`READY` means the screening checks found no issue. It does not mean the measurement is physically correct or that the model is validated.

`REVIEW_REQUIRED` means a human/research workflow must inspect the evidence before promotion.

## Uncertainty policy

Missing uncertainty does not cause the system to invent one. It is reported as a data-quality gap. The uncertainty may later come from an instrument specification, calibration certificate, repeated measurements, propagated uncertainty calculation, or another documented basis.

## Promotion boundary

```text
RAW EVIDENCE
   ↓
OBSERVED
   ↓
QUALITY SCREEN
   ↓
REVIEW
   ↓
VALIDATED PROPERTY / MODEL REVISION
```

This gate is intentionally conservative so that the knowledge base can grow without silently converting poor-quality measurements into authoritative material properties.
