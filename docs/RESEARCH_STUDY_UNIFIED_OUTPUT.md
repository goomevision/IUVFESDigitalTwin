# Unified Research Study Output

IUVFES now treats a research study as the parent record for scientific evidence, Digital Twin analysis, engineering design and publication preparation.

```text
STUDY ID
  ├── Materials / Samples / Batches
  ├── Instruments / Calibration
  ├── Experiments / Protocols
  ├── Raw + Processed Datasets
  ├── Simulation Runs / Model Versions
  ├── Equations / Parameter Sets
  ├── Comparisons / Validation
  ├── Hardware Design Revisions
  ├── Anomalies / Failed Runs
  ├── Replications
  ├── Uncertainty / Limitations
  └── Scientific Journal Report
```

## Two major outputs are now connected

### Scientific output

`Study -> Evidence -> Analysis -> Validation -> Journal/Research Package`

### Engineering output

`Study -> Simulation -> Hardware Model -> Evidence -> Engineering Drawing Package`

They share the same study ID, simulation runs, datasets, model versions and validation evidence. This prevents a journal result and an engineering design from silently referring to different model states.

## Readiness states

`EVIDENCE_INCOMPLETE` means required evidence is missing and the system lists blockers.

`READY_FOR_SCIENTIFIC_REVIEW` means the required evidence links exist. It does not mean the conclusions are proven or the physical design is safe.

## Completeness

The orchestrator reports an evidence completeness percentage based on required evidence collections. Completeness is a governance metric, not a scientific accuracy score.

## Output readiness

The study can independently report:

- journal report readiness;
- engineering evidence readiness;
- reproducibility package readiness.

A study can therefore have a complete scientific evidence chain while still lacking the physical engineering evidence needed for fabrication, or vice versa.

## Core principle

One Study ID is the common parent, but each claim remains linked to its actual source. No missing data is silently fabricated or inferred into the evidence record.
