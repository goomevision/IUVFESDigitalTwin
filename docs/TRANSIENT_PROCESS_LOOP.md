# Transient Process Loop

IUVFES now has a deterministic time-step coordinator for transient process simulation.

## Principle

Simulation time must advance explicitly. Physics modules receive a bounded `dt` and return the next process state.

If a requested interval is larger than the configured maximum step, the coordinator subdivides it rather than allowing one oversized update to skip pressure, temperature, phase or safety transients.

```text
simulation clock
      ↓
 bounded dt
      ↓
 thermodynamics
      ↓
 heat transfer
      ↓
 phase change
      ↓
 vacuum / pressure dynamics
      ↓
 sensors
      ↓
 safety checks
      ↓
 next state
```

## Important distinction

This loop provides temporal discipline; it does not itself make the physics model accurate. Accuracy still depends on validated constitutive equations, geometry, material properties, pump/valve characteristics, heat-transfer models, sensor models, calibration and experimental evidence.

## Safety implication

A production safety kernel should execute inside every bounded physics step so that rapid pressure or temperature transients cannot be hidden by a large simulation timestep.

## Next integration

The next layer should connect the loop to the vessel/hardware model and route each step through:

`hardware -> thermodynamics -> heat transfer -> phase change -> vacuum dynamics -> sensors -> safety`.
