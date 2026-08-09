# Scientific Database Implementation

This document defines the first persistence boundary for IUVFES research records.

## Tables

- `research_experiments`: canonical experiment notebook header and setup.
- `experiment_instruments`: instrument and calibration references used by an experiment.
- `instrument_calibrations`: calibration identity and certificate references.
- `sensor_observations`: append-oriented raw/quality-flagged observations with source payload hash.
- `operator_observations`: human observations and notes; never overwrite sensor values.
- `dataset_manifests`: immutable dataset identity, origin, quality status, storage reference and SHA-256.
- `provenance_records`: entity/activity/agent relationship connecting outputs to inputs.

## Storage rule

The relational database stores metadata and traceability. Large raw files, vendor exports, images and long sensor streams should live in object storage. The database stores the immutable storage reference and content hash.

## Migration safety

`drizzle/scientific-data.sql` is a schema proposal/transition artifact. It must be reconciled with the project's canonical Drizzle schema and generated migrations before deployment. Do not apply it directly to a production laboratory database without review.

## Research integrity

Raw observations are append-only. A correction creates a new observation/dataset or a derived dataset with provenance; the original remains addressable. Simulation and AI analysis use separate origin labels and cannot silently become experimental observations.

## Next implementation step

Add the equivalent definitions to `drizzle/schema.ts`, generate a reviewed migration, add repository/service procedures for experiment start/observation/closeout, and connect the notebook UI to those procedures. Integration tests must verify transaction boundaries and authorization before production use.
