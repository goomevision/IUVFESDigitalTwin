# Unified Research Evidence Report

The unified report is the human-review surface for one IUVFES `Study ID`. It brings together experimental, simulation, validation, uncertainty, engineering and reproducibility evidence without collapsing their epistemic status.

## Evidence classes

Every quantitative metric carries one of four source labels:

- `MEASURED` — recorded from an instrument/experiment;
- `SIMULATED` — produced by the Digital Twin/model;
- `DERIVED` — calculated from recorded values;
- `VALIDATED` — supported by an explicit validation process and criteria.

A metric must also retain a provenance identifier.

## Report sections

```text
Study Identity
Evidence Summary
Measured vs Simulated vs Derived vs Validated
Experimental Process
Time-Resolved Simulation
Thermodynamic and Phase Results
Pressure and Vacuum Transients
Mass and Energy Balance
Uncertainty and Sensitivity
Validation and Error Analysis
Engineering Design and Drawing Traceability
Warnings and Anomalies
Limitations
Scientific Interpretation
Journal Evidence
Reproducibility Evidence
Provenance
```

## Review gate

`READY_FOR_REVIEW` means the minimum evidence classes required by the current report contract are linked. It does not mean that the study is scientifically proven, that the hardware is safe, or that a drawing is approved for fabrication.

`INCOMPLETE` lists missing evidence blockers.

## Completeness

The completeness percentage measures presence of required evidence classes only. It must never be presented as an accuracy, confidence, safety factor, probability of success, or scientific truth score.

## Intended downstream use

The report becomes the common evidence surface for:

`Study → Validation → Engineering Design → Journal → Reproducibility Package`.

Human scientific and engineering review remains mandatory for conclusions, safety, and fabrication decisions.
