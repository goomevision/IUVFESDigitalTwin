# Uncertainty-Aware Validation

IUVFES now supports a declared uncertainty allowance in the validation gate.

## Independent uncertainty

For uncertainty terms that are justified as independent, the current implementation combines them using root-sum-square:

`u_combined = sqrt(u1² + u2² + ...)`

This may represent, for example, separately documented measurement and model uncertainty terms.

## Validation rule

The current gate applies the declared combined uncertainty as an allowance around the configured error limits:

`mean limit = configured mean error limit + combined uncertainty`

`maximum limit = configured maximum error limit + combined uncertainty`

The raw mean and maximum errors remain in the result and are never replaced by the uncertainty-adjusted values.

## Critical scientific boundary

This is an engineering screening rule, not a general statistical confidence interval or hypothesis test. Correlated uncertainties require covariance-aware propagation. Bias, drift, calibration error, systematic effects, sampling error and uncertainty distributions are not automatically inferred.

A future implementation should support explicit uncertainty budgets, distributions, confidence/coverage factors, covariance matrices, Monte Carlo propagation and predefined validation protocols.

## Evidence requirements

Each uncertainty term should retain:

- source/instrument or model component;
- unit;
- method used to estimate it;
- applicable operating range;
- revision/version;
- provenance ID.

A validation result is only valid for the declared operating regime and criteria.
