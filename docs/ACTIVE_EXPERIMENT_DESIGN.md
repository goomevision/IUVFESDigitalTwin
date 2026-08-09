# Active Experiment Design

IUVFES now has an evidence-driven ranking layer for deciding which next experiment can most usefully reduce model uncertainty.

## Inputs

Each uncertainty driver should provide:

- parameter;
- normalized uncertainty;
- model sensitivity;
- evidence gap;
- optional safety weight.

Each experiment candidate must provide an explicit estimate of expected information gain, feasibility and safety.

## Priority

The ranking combines these supplied quantities to prioritize candidates. It does not generate experimental truth or fabricate information gain.

```text
uncertainty
   × sensitivity
   × evidence gap
          ↓
   experiment priority
          ↑
information gain × feasibility × safety
```

## Example

If vapor pressure has high uncertainty and high sensitivity, a targeted vapor-pressure measurement can outrank a low-sensitivity density measurement—provided the proposed experiment is feasible and safe.

## Scientific boundary

The ranking is decision support. It does not authorize an experiment, establish safety, or replace an experimental protocol. Any operating limits, pressure limits, temperature ramps and equipment constraints must come from validated engineering requirements and competent review.

## Closed learning loop

```text
simulation
  ↓
sensitivity + uncertainty
  ↓
experiment candidates
  ↓
priority ranking
  ↓
operator / researcher selection
  ↓
experiment
  ↓
new evidence
  ↓
material revision
  ↓
validation
  ↓
next simulation
```
