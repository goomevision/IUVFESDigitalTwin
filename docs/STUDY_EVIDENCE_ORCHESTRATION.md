# Study Evidence Orchestration

A completed simulation run can now be integrated into one `StudyEvidenceState` together with extracted simulation metrics and one-at-a-time sensitivity evidence.

## Flow

```text
Simulation Run
     ↓
Time-series validation
     ↓
Evidence extraction
     ↓
Sensitivity analysis
     ↓
Study Evidence State
     ├── Scientific validation/reporting
     ├── Engineering design evidence
     └── Reproducibility package
```

## Update semantics

A simulation run with an existing `simulationRunId` replaces its previous evidence entry rather than creating an uncontrolled duplicate. The study records the latest integrated simulation run ID.

## Scientific boundary

The orchestrator connects evidence; it does not promote simulated values to measured or validated values. The source and epistemic status of each metric must remain available downstream.

The sensitivity callback must invoke the authoritative physics/simulation model. The orchestrator itself contains no physical assumptions.

## Next integration

The next layer should map this study evidence state into the existing journal, validation, engineering drawing, and reproducibility package builders, with explicit measured/simulated/derived/validated labels and provenance references.
