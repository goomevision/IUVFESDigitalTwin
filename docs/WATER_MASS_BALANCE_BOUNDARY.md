# IUVFES Water Mass-Balance Boundary

## Purpose

This boundary makes the water-like stream explicit in the scientific digital-twin record without claiming a complete plant-wide mass balance.

## Accounted quantities

- `waterRemovedKg`: cumulative water-like mass removed from the material inventory by the reduced-order process model.
- `coldTrapCondensedWaterKg`: cumulative water-like mass captured by the four cold-trap stages.
- `uncondensedOrUnaccountedWaterKg`: the current model-boundary remainder, calculated as removed water minus captured water.
- `closureErrorKg`: numerical closure residual; the diagnostic is considered closed when the residual is within tolerance.

## Interpretation

A non-zero remainder does **not** identify a chemical species or prove that material escaped the system. It means the current model has not represented that portion as cold-trap captured water. Possible causes inside the model boundary include insufficient thermal capacity, missing heat-transfer data, or condensable material remaining outside the represented capture path.

This diagnostic must not be presented as experimental measurement. It is a simulation accounting result.

## Scientific transition

When laboratory measurements become available, the same fields can be paired with measured receiver masses, gravimetric water recovery, and analytical composition. The simulation and measurement records should remain separately identified so that model outputs are never silently promoted to measured data.
