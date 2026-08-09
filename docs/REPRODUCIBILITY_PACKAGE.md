# IUVFES Reproducibility Package

The reproducibility package is the controlled research release produced from one `Study ID`. It binds scientific evidence, Digital Twin configuration, engineering design, software version and provenance into one auditable manifest.

## Package structure

```text
IUVFES-STUDY-PACKAGE/
├── study-metadata
├── research-question-and-hypothesis
├── raw-data-references
├── processed-data-references
├── protocols
├── instruments
├── calibrations
├── material-and-sample-records
├── digital-twin-models
├── governing-equations
├── parameter-sets
├── simulation-runs
├── validation-reports
├── engineering-design-revisions
├── journal-report
├── software-commits
├── provenance-manifest
├── reproduction-instructions
└── known-limitations
```

## Release states

`INCOMPLETE` means one or more required evidence classes are absent.

`COMPLETE` means the required references have been assembled into the manifest. It does **not** mean the scientific conclusions are proven, the hardware is safe, or the design is approved for fabrication.

## Reproduction instructions

A future implementation should generate machine-readable instructions containing:

1. study revision;
2. exact dataset versions;
3. exact model/software versions;
4. parameter-set identifiers;
5. equation/model identifiers;
6. simulation initial conditions;
7. timestep/control configuration;
8. expected validation tolerances;
9. required outputs;
10. known non-reproducible external dependencies.

## Evidence integrity

Raw data references should point to immutable/versioned evidence. Processed data must retain transformation history. Changes must create new revisions rather than silently rewriting the evidence used by an earlier study.

## Scientific and engineering boundary

The package unifies evidence, but it does not collapse scientific review and engineering approval into one status. Journal readiness, reproducibility completeness and fabrication readiness remain separate gates.
