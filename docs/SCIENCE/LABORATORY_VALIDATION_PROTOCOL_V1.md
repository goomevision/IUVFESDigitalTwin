# IUVFES Laboratory Validation Protocol v1

## 1. Purpose

This document defines the minimum empirical validation protocol for the IUVFES Scientific Digital Twin. It separates **numerical/model verification** from **laboratory validation**.

A simulation regression passing is not laboratory validation. A laboratory validation claim is permitted only when measured experimental observations are linked to the exact simulation input, model version, parameter set, and timestamped run being evaluated.

## 2. Validation boundary

The first laboratory campaign shall validate the quantities that can be measured reliably and compared directly with the digital twin:

1. mass balance / material recovery;
2. temperature response;
3. pressure / vacuum response;
4. electrical energy consumption;
5. actuator response and commanded-versus-observed operating level;
6. process completion time;
7. condenser/cold-trap recovery where applicable.

Thermodynamic quantities that are not directly measured must remain labelled as **model-derived** and must not be presented as experimentally validated.

## 3. Experimental traceability

Every experimental run MUST have a unique `experimentId` and record:

- experiment date/time and operator;
- apparatus/configuration identifier;
- sample identifier and material context;
- instrument identifiers and calibration status;
- raw measurement files or immutable references;
- sampling interval and units;
- ambient conditions where relevant;
- simulation input snapshot;
- simulation commit/model version;
- parameter set and calibration constants;
- digital-twin run identifier;
- acceptance criteria used for the comparison.

The simulation and laboratory record are one validation pair only when all required provenance fields are present.

## 4. Minimum measurement matrix

| Quantity | Laboratory observation | Digital-twin counterpart | Comparison |
|---|---|---|---|
| Initial mass | measured | initial material inventory | absolute + relative error |
| Final recovered mass | measured | final material inventory | recovery / closure error |
| Temperature | time series | sensor/model temperature frame | MAE, RMSE, max error |
| Pressure/vacuum | time series | pressure frame | MAE, RMSE, max error |
| Electrical power | time series | actuator/pump electrical model | MAE, RMSE |
| Energy | integrated meter value | model energy ledger | relative error |
| Actuator level | observed/recorded | `actuatorLevels` | command tracking error |
| Process duration | measured | simulation timestamp | absolute + relative error |
| Condensate/trap mass | measured where applicable | material inventory | mass recovery error |

## 5. Experimental design

### 5.1 Baseline runs

Run the apparatus without process material, where safe and meaningful, to establish:

- sensor zero/bias;
- vacuum-pump electrical baseline;
- heater/cooling electrical baseline;
- environmental heat/background effects;
- instrument noise and repeatability.

### 5.2 Controlled material runs

Use a documented material/sample preparation procedure. Record initial mass and relevant material properties before the run. Do not silently substitute material properties between the laboratory record and simulation input.

### 5.3 Replicates

For each validation condition, collect repeated runs sufficient to estimate repeatability. The exact number shall be determined by the laboratory measurement plan and should not be invented by the software.

### 5.4 Hold-out validation

Parameters fitted or calibrated from a subset of runs MUST NOT be used to claim independent validation on those same runs. At least one independent hold-out run/condition is required for a validation claim.

## 6. Comparison metrics

For paired observed value `y_obs` and model value `y_model`:

- absolute error = `y_model - y_obs`;
- absolute percentage error = `|y_model - y_obs| / max(|y_obs|, epsilon) * 100`;
- MAE = mean absolute error over aligned samples;
- RMSE = square root of mean squared error;
- maximum absolute error = maximum absolute pointwise error.

For mass balance:

`closure_error = (initial_mass - recovered_mass - accounted_loss) / initial_mass`

For energy:

`closure_error = (measured_input_energy - accounted_model_energy) / measured_input_energy`

All comparisons MUST use consistent units before calculation.

## 7. Acceptance criteria

Acceptance limits MUST be declared before evaluating the validation result. They shall be based on instrument uncertainty, process variability, engineering requirements, and the intended use of the digital twin.

The software MUST NOT hard-code arbitrary laboratory acceptance thresholds merely to obtain a PASS.

A validation result shall be one of:

- `PASS`: predefined criteria satisfied and provenance complete;
- `PASS_WITH_LIMITATIONS`: primary criteria satisfied but one or more declared limitations remain;
- `FAIL`: one or more mandatory criteria not satisfied;
- `INCONCLUSIVE`: insufficient or invalid experimental evidence;
- `NOT_VALIDATED`: no qualifying laboratory evidence exists.

## 8. Uncertainty

Reported model-versus-laboratory differences MUST be interpreted against measurement uncertainty. Instrument resolution is not automatically equivalent to measurement uncertainty.

Where available, include calibration uncertainty, repeatability, bias, sampling uncertainty, and relevant environmental uncertainty. The validation record should preserve the uncertainty method used.

## 9. Time alignment

Laboratory observations and simulation observations MUST be aligned using a declared time basis. Do not compare independently sampled sequences solely by array index.

The preferred alignment key is the experiment timeline with explicit timestamps. If interpolation or resampling is required, record the method and interval.

## 10. Validation gate

A laboratory validation claim is blocked when any of the following is missing:

- raw or immutable experimental evidence;
- instrument/provenance information;
- simulation input snapshot;
- model/version identifier;
- declared acceptance criteria;
- time alignment method;
- uncertainty treatment where relevant;
- independent validation evidence for calibrated parameters.

This gate is intentionally conservative.

## 11. Scientific status language

Use:

> "Numerically verified against the declared model and regression suite. Laboratory validation pending/partial/completed according to the recorded experimental evidence."

Do NOT use:

> "Experimentally validated"

unless the requirements in this protocol are satisfied by actual measured laboratory evidence.

## 12. Required deliverables for a completed campaign

1. laboratory raw-data archive;
2. instrument/calibration record;
3. experiment manifest;
4. simulation input snapshot;
5. digital-twin run artifact;
6. automated comparison report;
7. uncertainty statement;
8. deviations/anomalies log;
9. hold-out validation result;
10. signed scientific review/approval record.

## 13. Versioning rule

A change to the physics model, parameterization, unit convention, actuator mapping, sensor interpretation, or numerical integration that can affect a validated quantity invalidates the affected validation result until the experiment/model comparison is re-run.

Laboratory validation is therefore tied to a model version, not to the application UI alone.
