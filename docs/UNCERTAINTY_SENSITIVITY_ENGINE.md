# Uncertainty and Sensitivity Engine

IUVFES now has a deterministic one-at-a-time sensitivity contract. It receives parameter ranges and delegates each evaluation to the authoritative physics/simulation model.

## Purpose

The engine answers:

- how much an output changes when one input changes within its defined range;
- which parameters have the largest output span;
- what parameter ranges were actually evaluated.

## Method

For each parameter:

```text
minimum ─── nominal ─── maximum
    │          │           │
    └──────────┼───────────┘
               ↓
      authoritative simulation
               ↓
       output low/nominal/high
               ↓
       sensitivity evidence
```

The current implementation is deliberately one-at-a-time. It is not a substitute for Monte Carlo, polynomial chaos, Bayesian uncertainty propagation, global sensitivity analysis, or coupled uncertainty analysis.

## Scientific discipline

The engine does not invent output values. It receives them from the authoritative simulation/physics function. Parameter ranges must be explicit and documented.

Sensitivity is not causality. A high sensitivity score means the modeled output changes strongly over the tested range; it does not by itself establish an experimental causal relationship.

## Future extensions

1. measurement uncertainty propagation;
2. correlated parameter uncertainty;
3. Monte Carlo sampling;
4. global sensitivity indices;
5. confidence/credible intervals;
6. uncertainty bands on time-series plots;
7. sensitivity of pressure, temperature, yield, energy and safety metrics;
8. automatic inclusion in journal and engineering evidence packages.
