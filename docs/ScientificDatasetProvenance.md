# Scientific Dataset & Provenance

## Purpose

IUVFES treats every closed-loop simulation as a reproducible data-producing activity. The simulator output is not automatically considered laboratory-validated evidence.

## Lifecycle

```text
Experiment input
      |
      v
Deterministic closed-loop simulation
      |
      +--> causal event journal
      |       |
      |       +--> SHA-256 hash chain
      |
      +--> simulation result
      |
      v
Content-addressed dataset manifest
      |
      +--> provenance record
      |
      v
RAW dataset
      |
      +--> laboratory calibration/validation
      v
VALIDATED -> REVIEWED -> CALIBRATED -> REPLICATED -> PUBLISHED
```

## Dataset identity

A dataset receives a UUID for database identity and a SHA-256 digest over a canonical representation of its simulation inputs, outputs, frames and event-chain terminal hash. The digest is an integrity identifier; it is not a claim of scientific validity.

## Provenance

Each persisted simulation dataset records:

- experiment ID;
- complete simulation parameters;
- simulator mode;
- terminal simulation status;
- final sensors and causal frames;
- event count and terminal event hash;
- dataset SHA-256;
- provenance activity linking the experiment inputs to the dataset output.

## Quality boundary

Simulation datasets are persisted as `RAW`. They must not be promoted to `VALIDATED`, `CALIBRATED`, `REPLICATED`, or `PUBLISHED` merely because the simulator completed successfully. Promotion requires an explicit scientific validation workflow using laboratory evidence.

## Reproducibility target

For identical inputs, simulator version, model parameters and deterministic execution settings, the same causal sequence should produce the same scientific content hash. Any intentional model change must therefore be represented by a new software/model version rather than silently replacing historical data.
