# IUVFES Scientific Data Model — Implementation Contract v1

## Purpose

This document translates the Scientific Discovery Constitution into an implementation boundary for the IUVFES Digital Twin. It does not assert new physical facts. It defines how the application must preserve evidence, uncertainty, provenance, sample context, and the human–AI–laboratory feedback loop.

## Core rule

`MATERIAL != SAMPLE != EXPERIMENT != SIMULATION != EVIDENCE != AI_INFERENCE`

A material is a biological/material definition. A sample is a concrete instance with context. An experiment records what was actually done. A simulation is a model execution. Evidence records provenance and quality. AI analysis is an interpretation and must remain distinguishable from observation.

## Sample context

Every laboratory or literature record should preserve, when available:

- scientific name and cultivar;
- plant/material part;
- sample state: fresh, wet, dried, frozen, freeze-dried, thawed, powder, other, unknown;
- moisture;
- geographic origin and altitude;
- cultivation system, fertilizer, pesticide and irrigation context;
- plant age, growth stage, harvest date/time and season;
- washing, drying, freezing, storage and thawing history;
- cutting, grinding, homogenization and particle-size preparation.

Unknown values are valid. They must not be silently replaced by defaults.

## Evidence layers

Every final scientific report exposes five distinct sections:

1. **VERIFIED / OBSERVED** — measurements or source observations supported by their provenance.
2. **ESTIMATED / MODEL** — calculated or assumed values clearly marked as estimates.
3. **AI ANALYSIS** — model interpretation, pattern detection and recommendations.
4. **UNKNOWN / KNOWLEDGE GAP** — missing, insufficient or conflicting information.
5. **NEXT EXPERIMENT** — proposed real-world tests that can strengthen, weaken or falsify a hypothesis.

The system must never collapse these layers into one numeric result.

## Frequency sweep boundary

A response peak is initially stored as `OBSERVED_PEAK`. A peak must not automatically become a molecular resonance claim. A possible resonance interpretation is represented separately and requires additional evidence.

The system must support zero, one, or many detected peaks. It must not force four peaks.

## Evidence accumulation

Repeated experiments are retained individually. Aggregation may calculate mean, standard deviation, coefficient of variation, confidence intervals and repeatability, but the original observations remain immutable records.

Independent laboratories and independent datasets are distinguishable from repeated runs in the same laboratory.

Conflicting observations are retained as conflicts. They are not overwritten by the newest result. The AI may propose context variables that could explain the conflict, such as sample state, moisture, geography, cultivar, preparation, solvent, temperature, pressure, ultrasonic intensity or hardware configuration.

## Experiment planning

Recommendations must state:

- what knowledge gap is being addressed;
- why the experiment is informative;
- which variables are controlled or changed;
- what observation would support the hypothesis;
- what observation would weaken or falsify it;
- expected information gain when available.

The operator remains the decision-maker. The planner is an assistant, not an authority.

## Current repository integration

The existing database already contains material, experiment, research experiment, instrument/calibration, sensor observation, operator observation, dataset manifest, provenance and closed-loop session concepts. The new `shared/scientific.ts` contract is intentionally additive and can be mapped onto those existing records before any destructive database migration is considered.

Existing closed-loop simulation behavior must not be rewritten merely to introduce the scientific metadata layer. Scientific metadata should wrap and trace the simulation rather than replace its runtime state.

## Implementation sequence

1. Adopt `shared/scientific.ts` as the TypeScript contract.
2. Map existing `materials` and `researchExperiments` to `Material` and `SampleIdentity` concepts.
3. Add persistent sample-context storage without deleting existing fields.
4. Add experiment-purpose and knowledge-status fields through additive migrations.
5. Add frequency-sweep and detected-peak persistence.
6. Add material-gap persistence.
7. Add evidence aggregation and conflict detection.
8. Add three-layer report generation plus unknowns and next-experiment recommendations.
9. Connect Material Trainer to real experiment records.
10. Only after data integrity is proven, connect learned profiles to simulation inference.

## Scientific safety boundary

Literature frequencies are reported experimental conditions unless the source explicitly establishes a resonance measurement. Literature data must not be converted into `f0`, bandwidth, Q-factor or molecular resonance fingerprints merely because an extraction experiment used that frequency.

Simulation estimates must remain identifiable as simulation/model output. Laboratory observations must remain traceable to sample, instrument, operator, protocol and dataset provenance.
