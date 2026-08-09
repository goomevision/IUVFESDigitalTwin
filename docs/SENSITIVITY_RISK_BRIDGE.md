# Sensitivity → Uncertainty → Risk Priority

IUVFES now provides a screening bridge that combines sensitivity results with declared uncertainty sources to prioritize investigation.

## Priority logic

- `HIGH`: normalized sensitivity >= 1 and at least one mapped uncertainty source;
- `MEDIUM`: normalized sensitivity >= 0.5 or at least one mapped uncertainty source;
- `LOW`: lower sensitivity with no mapped uncertainty source.

The thresholds are configuration-level screening defaults, not universal engineering limits.

## Intended use

The priority list can guide:

1. better sensor selection/calibration;
2. improved material-property measurement;
3. tighter dimensional control;
4. additional experiments;
5. model refinement;
6. parameter-range reduction when justified;
7. engineering design review.

## Critical boundary

This is **not** a probability-of-failure model, safety factor calculation, FMEA replacement, or structural-code compliance check. A high priority means the parameter deserves attention because model output is sensitive and/or uncertainty is declared; it does not mean the hardware will fail.

## Evidence chain

```text
Uncertainty Budget
       +
Sensitivity Analysis
       ↓
Priority Screening
       ↓
Research / Measurement / Design Action
       ↓
New Evidence
       ↓
Study Revision
```
