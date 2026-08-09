# Simulation ↔ Experimental Comparison

IUVFES now provides a deterministic comparison layer for numerical agreement between a Digital Twin time-series and laboratory sensor observations.

## Scope

The comparison engine calculates, per parameter:

- sample count
- excluded count
- mean experimental value
- mean simulated value
- bias (`simulation - experimental`)
- mean absolute error (MAE)
- root mean square error (RMSE)
- maximum absolute error
- residual time-series
- median timestamp alignment error

Simulation values are linearly interpolated at experimental timestamps. Experimental observations marked `REJECTED` are excluded. Observations outside the simulation time domain are reported as unmatched rather than extrapolated.

## Verdict semantics

- `PASS`: acceptance tolerances were supplied and every supplied metric stayed within tolerance.
- `FAIL`: at least one supplied tolerance was exceeded.
- `INCONCLUSIVE`: numerical metrics are available but no acceptance tolerance was supplied, or no comparable samples exist.

The system deliberately does **not** convert numerical agreement into physical-model validation. Calibration status, measurement quality, uncertainty, experimental protocol, and scientific review remain separate evidence requirements.

## API

`scientific.compareExperiment` accepts a `researchExperimentId` and optional per-parameter tolerances. It loads the linked experimental observations and simulation result, aligns experimental time to the first observation, maps the simulator channels, and returns a comparison report.

Supported simulation channels currently exposed by the API:

| Comparison parameter | Simulation field |
| --- | --- |
| `pressure` | `pressure` |
| `temperature` | `temperature` |
| `yield` | `yieldPercentage` |
| `waterRemoved` | `waterRemoved` |
| `oilRecovered` | `oilRecovered` |
| `energy` | `energyConsumed` |

## Scientific boundary

A comparison report is an analysis artifact. It is not a publication, certification, or claim that the physical model is correct. Any future publication workflow must retain the raw observations, calibration evidence, provenance, dataset hashes, model version, and comparison tolerances used to produce the report.
