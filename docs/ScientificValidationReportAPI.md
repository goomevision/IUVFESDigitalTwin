# Scientific Validation Report API

The `scientific.validationReport` procedure builds a deterministic validation report from the research experiment evidence chain.

## Inputs

- `researchExperimentId` — required research experiment identifier.
- `tolerances` — optional simulation-versus-experiment acceptance thresholds. If omitted, comparison remains `INCONCLUSIVE`.
- `mass` / `massTolerance` — optional declared mass balance evidence.
- `energy` / `energyTolerance` — optional declared energy balance evidence.

## Report sections

The report currently assembles:

1. evidence-chain readiness;
2. simulation versus experimental comparison, when acceptance thresholds and linked time-series evidence are available;
3. mass and energy balance, when supplied.

## Verdict rules

- Any `FAIL` section makes the overall report `FAIL`.
- No `FAIL`, but any `INCONCLUSIVE`, makes the report `INCONCLUSIVE`.
- Only all-`PASS` sections can produce an overall `PASS`.
- `READY` requires experiment evidence, simulation evidence, provenance, and no failed section.

A report verdict is not a claim of scientific truth. It summarizes declared evidence and acceptance criteria and must remain subject to scientific review.
