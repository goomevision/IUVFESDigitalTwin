# Replicate & Uncertainty Validation

## Purpose

IUVFES distinguishes numerical agreement from measurement uncertainty. The replicate layer summarizes repeated experimental measurements and, when supplied, combines repeatability with instrument standard uncertainty.

## Statistics

For finite replicate values, the engine reports:

- count
- mean
- sample standard deviation
- standard error of the mean
- coefficient of variation
- minimum and maximum

The repeatability contribution is the standard error of the mean.

## Combined uncertainty

When an instrument standard uncertainty is supplied, the engine estimates:

`u_combined = sqrt(u_repeatability^2 + u_instrument^2)`

The expanded uncertainty is:

`U = k * u_combined`

where `k` is supplied by the caller and defaults to 2. The resulting interval is centered on the experimental mean.

This is an explicit, limited uncertainty model. It is **not** a complete ISO/GUM uncertainty budget and does not infer uncertainty components that were not supplied.

## Validation semantics

A replicate validation result is:

- `PASS` only when an explicit numerical acceptance tolerance is supplied and the simulation residual is inside it.
- `FAIL` when an explicit tolerance is supplied and the residual exceeds it.
- `INCONCLUSIVE` when fewer than two finite replicates are available or no acceptance tolerance is supplied.

The engine also reports whether the residual falls within the expanded uncertainty interval. That indicator is supporting evidence, not a substitute for an acceptance criterion.

## Scientific boundary

Repeatability statistics and uncertainty estimates do not prove that a Digital Twin is physically valid. They describe the evidence available for the measurement comparison. Model validity requires appropriate experimental design, calibration, uncertainty analysis, physical assumptions, and scientific review.
