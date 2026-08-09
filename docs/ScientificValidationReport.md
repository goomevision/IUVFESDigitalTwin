# Scientific Validation Report

The Scientific Validation Report is the evidence-level synthesis for an IUVFES research experiment. It combines validation sections without silently converting incomplete evidence into a positive scientific claim.

## Evidence chain

```text
Experiment
  -> Experimental observations
  -> Instrument/calibration evidence
  -> Simulation result
  -> Simulation/experiment comparison
  -> Replicate uncertainty
  -> Mass balance
  -> Energy balance
  -> Provenance
  -> Scientific Validation Report
```

## Verdict rules

- `PASS`: every supplied section passes its explicit acceptance criteria.
- `FAIL`: at least one supplied section fails its explicit acceptance criteria.
- `INCONCLUSIVE`: no section fails, but at least one section lacks enough evidence or an explicit acceptance criterion.

An empty tolerance or missing acceptance criterion must never become `PASS`.

## Readiness

`READY` requires a non-failing report plus experimental observations, a linked simulation result, and provenance records. Readiness is an evidence-chain state; it is **not** a claim that the physical model or measurement system is scientifically valid.

## Provenance

The report keeps the research experiment ID, source experiment ID, dataset identifiers, observation count, simulation-result presence, and provenance-record count. This allows a future publication pipeline to trace a conclusion back to its source evidence.
