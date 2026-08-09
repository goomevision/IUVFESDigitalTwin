# IUVFES Research Evidence Dashboard

The dashboard is a human-review surface for one `Study ID`. It does not replace the underlying evidence, provenance, validation or engineering review.

## Dashboard areas

1. Study identity and revision;
2. evidence completeness;
3. provenance coverage;
4. headline metrics with source classification;
5. experiment/simulation/validation/design/journal timeline;
6. pressure and temperature transient summaries;
7. mass and energy balance summaries;
8. uncertainty and sensitivity results;
9. warnings and anomalies;
10. engineering design traceability;
11. journal evidence readiness;
12. reproducibility evidence;
13. blockers and limitations.

## Source classification

Metrics remain explicitly classified as `MEASURED`, `SIMULATED`, `DERIVED`, or `VALIDATED`. The dashboard must never visually imply that simulated values are measured values.

## Review discipline

A green evidence status means that the current structural evidence gate is satisfied. It does not mean the physical model is correct, the instrument is accurate, the hardware is safe, or the paper's conclusions are proven.

## Timeline

The timeline connects experiment, simulation, validation, engineering design and journal identifiers so a reviewer can navigate the digital thread from observation to publication.

## Next UI integration

The model should be exposed by the application API and rendered as a dashboard with links to the underlying records. Graphs should preserve units, timestamps, source classification, uncertainty and provenance identifiers.
