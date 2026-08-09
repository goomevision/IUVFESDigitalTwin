# Physical Dynamics Engine

IUVFES now has a first explicit time-dependent physics kernel to connect the physical timeline to material and vessel behavior.

## Current modeled relationships

For each timestep the kernel evaluates:

1. material vapor pressure at the current temperature;
2. pressure driving force for evaporation;
3. evaporated mass over the timestep;
4. latent heat consumed by evaporation;
5. heater input and vessel heat loss;
6. sensible temperature change;
7. remaining material mass.

The model therefore produces a state trajectory rather than assigning a final temperature or mass instantaneously.

## Important scope limitation

This is a **foundation, not a validated production solver**. The current pressure update contains an explicitly documented ideal-gas-like placeholder and does not yet represent real vessel geometry, vapor composition, condenser behavior, non-condensable gases, pump curves, multicomponent phase equilibrium, boiling correlations, heat-transfer correlations, or pressure-vessel structural mechanics.

Those components must be added from authoritative equations, material data and engineering standards before physical predictions are treated as validated.

## Intended coupling

```text
Operator Command
      ↓
Control / Actuator Model
      ↓
Physical Process Timeline
      ↓
Physical Dynamics Engine
      ├── Heat transfer
      ├── Phase change
      ├── Mass transfer
      ├── Pressure
      └── Energy balance
      ↓
Actual State
      ↓
Sensors / Evidence
```

## Time behavior

A longer physical timestep causes more accumulated heat transfer, evaporation and energy change; it is not equivalent to jumping directly to a final setpoint. The adaptive timeline decides computational step size, while the dynamics kernel advances the physical state by that step.

## Scientific requirement

Every material property correlation and engineering relationship used in production must retain a source, validity range, unit, uncertainty and provenance ID. A placeholder relationship must remain explicitly marked as such and must not be presented as validated experimental physics.
