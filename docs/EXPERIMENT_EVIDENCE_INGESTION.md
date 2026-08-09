# Experiment Record & Evidence Ingestion

IUVFES now has a structured boundary between an experiment and the knowledge base.

## Experiment record

Every experiment record carries:

- experiment ID;
- material ID and material-model revision;
- operator/researcher ID;
- protocol ID;
- start timestamp;
- observations and units;
- raw-evidence identifiers;
- optional conditions and notes.

The ingestion layer converts explicit observations into `OBSERVED` evidence while retaining experiment provenance.

## Raw evidence is mandatory

The system refuses ingestion when a record has no raw-evidence identifiers. The intention is to prevent a typed number from becoming scientific evidence without a traceable origin.

Raw evidence can later refer to instrument exports, files, chromatograms, sensor logs, photographs, or other study artifacts through the repository's evidence-storage layer.

## Simulation reconciliation

Experimental observations can be aligned to simulation samples by **physical time**, not wall-clock execution time. This preserves the process-time principle used throughout IUVFES.

```text
experiment observation
       ↓
physical timestamp
       ↓
nearest simulation physical timestamp
       ↓
absolute error
       ↓
validation / investigation
```

## Scientific boundary

Automatic ingestion does not mean automatic validation. Observations become `OBSERVED` evidence; validation still requires explicit comparison criteria, uncertainty/tolerance and study context.

The ingestion layer also does not overwrite material properties or model revisions. New evidence must pass through the existing evidence-gated promotion and versioning workflow.
