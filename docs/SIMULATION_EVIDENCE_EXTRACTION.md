# Automatic Simulation Evidence Extraction

Each completed simulation run should produce a structured evidence record before its results are used by scientific reporting or engineering design.

## Extracted evidence

The current extraction contract records:

- simulation run ID;
- Digital Twin/model version;
- parameter-set ID;
- linked dataset IDs;
- pressure minimum/maximum;
- maximum absolute pressure rate;
- temperature minimum/maximum;
- maximum absolute temperature rate;
- initial/final mass and mass change;
- phase quality range when available;
- yield when available;
- energy input/output and balance when available;
- warnings and transient events.

## Evidence flow

```text
Simulation Frames
      ↓
Time-Series Validation
      ↓
Evidence Extraction
      ↓
Study Evidence Record
      ├── Scientific Journal
      ├── Validation
      ├── Engineering Design
      └── Reproducibility Package
```

## Integrity rules

Time-series timestamps must be strictly increasing. Non-finite values are rejected. The extractor calculates derived metrics from recorded simulation values and does not invent missing measurements.

An extracted metric is not automatically a validated physical measurement. Its epistemic status remains tied to the source: simulated, measured, derived, or validated.

## Next integration

The extracted evidence should be attached to the `Study ID` and included in the final evidence/provenance manifest. Future versions should add uncertainty propagation, sensitivity metrics, sensor-model error, material/yield metrics, and explicit measured-vs-simulated classification.
