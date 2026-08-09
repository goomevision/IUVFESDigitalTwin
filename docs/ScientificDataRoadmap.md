# IUVFES Scientific Data Roadmap

## Implemented foundation

- Experiment notebook data contract.
- Experiment lifecycle adapter.
- Researcher-facing notebook UI.
- Provenance contracts and journal.
- Dataset manifest hashing.
- Explicit experimental/simulation/derived/AI origins.
- Preservation of failed experiments and anomalies.

## Production sequence

### Phase 1 — Persistent research record

Move `ExperimentNotebookStore` to Drizzle-backed tables. Keep raw sensor observations append-only. Store object references and SHA-256 hashes for large files.

### Phase 2 — Instrument ingestion

Create a normalized ingestion adapter for laboratory instruments. Preserve the original vendor payload and record instrument serial, calibration version, acquisition time, unit and quality flags.

### Phase 3 — Dataset release

Generate immutable dataset manifests with version, checksum, provenance, license, visibility and validation status. Never silently replace a released dataset.

### Phase 4 — Digital Twin comparison

Link each experiment to one or more simulation runs. Compute prediction error and retain model/configuration/software commit references.

### Phase 5 — Scientific analysis

Generate reproducible analysis artifacts from fixed dataset versions. Store analysis code/version and statistical method alongside outputs.

### Phase 6 — Publication

Generate a journal-ready report package containing methods, results, limitations, provenance, software/model versions and dataset references. A DOI/persistent identifier should be assigned by an appropriate research repository; the application must store the resulting identifier rather than inventing one.

## Non-negotiable research rules

1. Raw data is append-only evidence.
2. Corrections produce derived versions; raw data remains addressable.
3. Simulation output is never presented as experimental measurement.
4. AI interpretation is labeled as analysis/hypothesis until scientifically validated.
5. Failed experiments remain discoverable.
6. Every published result must identify the dataset, software, model and calibration versions used to produce it.
7. Production laboratory use requires validation against actual instruments and procedures.
