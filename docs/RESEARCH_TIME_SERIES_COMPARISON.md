# Real vs Digital Twin Time-Series Comparison

IUVFES now defines a traceable comparison contract for measured and simulated process time-series.

## Metrics

The comparison can be used for pressure, temperature, mass, energy-related signals, or other scalar process variables with a defined unit.

For each common timestamp:

`absolute error = |measured - simulated|`

The report records maximum absolute error, mean absolute error, and the number of compared points.

## Data integrity

- measured and simulated timestamps must be strictly increasing;
- non-finite values are rejected;
- only identical timestamps are compared by the current implementation;
- missing timestamps are not silently interpolated;
- original measured and simulated series are retained.

This prevents the comparison layer from inventing observations or hiding differences caused by sampling schedules.

## Scientific interpretation

An error metric is descriptive unless a predefined validation criterion exists. IUVFES must not label a simulation as validated merely because its numerical error is small.

Validation criteria should be defined before or independently of result interpretation when practical, including acceptable error bands, operating regime, sensor uncertainty, and the purpose of validation.

## Dashboard integration

The comparison output should feed:

```text
Measured Series
Simulated Series
Absolute Error Series
Maximum Error
Mean Absolute Error
Compared Points
Validation Status
Provenance
```

This becomes the basis for the Real-vs-Digital-Twin section of the unified research report and journal evidence package.
