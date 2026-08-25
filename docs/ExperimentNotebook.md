# IUVFES Digital Laboratory Notebook

The notebook is the research-facing record around a real experiment. It is separate from the simulator UI and is designed to preserve the context required to reproduce, audit and later publish an experiment.

## Lifecycle

```text
DRAFT → READY → RUNNING → PAUSED → COMPLETED / FAILED → REVIEWED
```

## Required research context

- experiment ID;
- researcher identity;
- objective and optional hypothesis;
- material/sample/batch and mass;
- equipment and calibration references;
- environmental conditions;
- procedure;
- input parameters;
- operator notes;
- sensor/operator observations;
- raw and derived dataset IDs;
- Digital Twin simulation IDs;
- provenance ID;
- closeout outcome and conclusion.

## Immutable evidence principle

The notebook does not replace raw instrument files. Raw observations must be stored in the research data store/object store with a content hash. Corrections create a new derived dataset and provenance record; the original raw dataset remains addressable.

## Closeout

An experiment can end as `SUCCESS`, `FAILED`, `ABORTED`, or `INCONCLUSIVE`. A failed experiment is still a valid research record and must remain discoverable.

## Current implementation boundary

`ExperimentNotebookStore` is currently an in-memory adapter intended to establish the contract and test the lifecycle. It must be replaced by a persistent database/object-store adapter before production laboratory use.

The next production step is to connect the notebook contract to the existing Drizzle database, create append-only observation/event tables, attach dataset manifests and provenance records, and then build the researcher-facing Experiment Notebook UI.
