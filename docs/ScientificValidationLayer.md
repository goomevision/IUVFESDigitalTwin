# Scientific Validation Layer

## Purpose

The validation layer separates **evidence-chain readiness** from scientific truth.

An experiment may be marked `READY_FOR_REVIEW` only when the repository can show a complete traceability chain:

```text
Research Experiment
      ↓
Sensor Observations
      ↓
Instrument Assignment
      ↓
Calibration Evidence
      ↓
Experimental Dataset
      ↓
Simulation Dataset (when comparison is intended)
      ↓
Provenance
      ↓
Scientific Review
```

`scientific.validationReadiness` evaluates this chain. It does **not** certify a physical model, measurement accuracy, causal validity, or scientific conclusion.

## Readiness states

- `BLOCKED` — the research experiment does not exist.
- `INCOMPLETE` — evidence is missing or calibration is incomplete.
- `READY_FOR_REVIEW` — the evidence chain is complete enough to enter scientific review.

## Calibration rule

Every assigned instrument must have calibration evidence. If an assignment specifies a calibration ID, that calibration is checked; otherwise the most recent calibration for the instrument is considered. Expired calibration evidence does not satisfy readiness.

## Data origin

Simulation and experimental datasets remain explicitly separated through the dataset manifest `origin` field. A simulation result must never be represented as experimental validation merely because the simulator completed successfully.

## Next validation stage

After readiness, a future validation service should calculate comparison metrics between experimental observations and simulation series, including sample count, bias, MAE, RMSE, maximum absolute error, and time alignment quality. Those metrics must be tied to immutable dataset/provenance identifiers and must not silently convert missing or rejected observations into valid data.
