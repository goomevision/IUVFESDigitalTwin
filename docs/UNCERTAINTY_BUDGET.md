# IUVFES Uncertainty Budget

The uncertainty budget records where uncertainty comes from before it is propagated into a validation result.

## Required metadata

Every uncertainty source should include:

- source ID and name;
- numerical value and unit;
- estimation method;
- scope/applicable operating regime;
- provenance ID;
- independence declaration.

Examples may include sensor calibration uncertainty, resolution, model parameter uncertainty, material-property uncertainty, dimensional tolerance, or other explicitly justified sources.

## Propagation

If all sources are justified as independent and expressed in the same output unit, the current implementation uses root-sum-square (RSS):

`u_c = sqrt(sum(u_i^2))`

If any source is not independent, the budget is blocked with `COVARIANCE_REQUIRED`. It must not silently apply RSS to correlated terms.

## Why this matters

The uncertainty budget separates:

```text
raw measurement
      ↓
measurement uncertainty
      ↓
model uncertainty
      ↓
combined uncertainty
      ↓
validation decision
```

It prevents an apparently small model error from being interpreted without considering instrument and model uncertainty.

## Engineering design relevance

For hardware design, uncertainty sources can later be mapped to dimensions and operating limits. The system should report sensitivity and uncertainty together rather than turning uncertainty into an invented safety factor.

Pressure-vessel design, relief protection and structural safety require the applicable engineering code and competent engineering review; this uncertainty budget does not replace those requirements.
