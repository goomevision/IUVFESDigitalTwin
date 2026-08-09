# Scientific Journal Evidence Pipeline

IUVFES should produce a research record in which the final scientific report is assembled from the same traceable evidence used by the experiment and Digital Twin.

## Evidence chain

```text
Research Question
      ↓
Hypothesis
      ↓
Material + Sample + Batch
      ↓
Hardware Configuration
      ↓
Instrument + Calibration
      ↓
Experimental Protocol
      ↓
Raw Dataset
      ↓
Time-Resolved Experiment
      ↓
Digital Twin Simulation
      ↓
Thermodynamic / Process Analysis
      ↓
Mass & Energy Balance
      ↓
Pressure / Vacuum Transients
      ↓
Experimental-vs-Simulation Comparison
      ↓
Uncertainty / Sensitivity
      ↓
Validation
      ↓
Engineering Design Analysis
      ↓
Scientific Journal Report
```

## Journal report requirements

The report structure includes abstract, research question/hypothesis, materials, hardware, protocol, governing equations, numerical parameters, time-resolved results, phase-change results, mass/energy balance, vacuum transients, engineering design analysis, comparison, uncertainty/sensitivity, anomalies and failed runs, validation/reproducibility, limitations, discussion, conclusions, provenance and references.

## Evidence discipline

Every quantitative claim should be traceable to one or more of:

- experiment ID;
- dataset ID/version;
- simulation run ID;
- hardware model/version;
- equation/model ID;
- validation report ID;
- instrument/calibration record.

Measured, simulated and validated values must remain distinguishable.

## Negative results

Failed experiments, anomalies and negative results are retained as evidence rather than removed because they do not support the hypothesis.

## AI role

AI may assist with pattern discovery, interpretation, literature synthesis and hypothesis generation. AI-generated interpretations must be labeled as interpretation/hypothesis until supported by independent evidence.

## Publication readiness

`COMPLETE` means the required evidence fields are linked, not that the scientific conclusions are true. Publication still requires human scientific review, appropriate statistical analysis, domain review, reproducibility, ethical/data governance checks where applicable, and journal-specific requirements.

## Reproducibility package

A strong release should include, as appropriate:

1. manuscript;
2. raw/immutable dataset references;
3. processed dataset and transformation history;
4. experiment protocol;
5. instrument/calibration metadata;
6. Digital Twin model version;
7. governing equations and parameter sets;
8. simulation run configuration;
9. validation report;
10. engineering design revision;
11. software commit/version;
12. uncertainty and sensitivity analysis;
13. supplementary figures/tables;
14. provenance manifest.
