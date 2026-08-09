# IUVFES Transient Process Physics Kernel

The process kernel is the first executable boundary between the scientific equation registry and Digital Twin process state.

## Current scope

The kernel implements a deliberately conservative single-phase, lumped thermal control-volume step:

```text
m Cp dT/dt = Qdot_in - Qdot_out

dm/dt = mdot_in - mdot_out
```

An optional pressure diagnostic uses the ideal-gas relation:

```text
P V = n R T
```

## Safety of the model boundary

The current kernel does **not** model phase change, latent heat, boiling curves, non-ideal vapor behavior, multiphase flow, wall heat-transfer coefficients, chemical reaction kinetics, or vessel structural stress.

Those are explicit future model requirements. The engine must not silently substitute this simple model for them.

## Time handling

Every step advances by an explicit positive `dtSeconds`. State is not teleported between process stages. The returned state records time, temperature, pressure, mass and internal-energy change.

## Conservation diagnostics

Each step reports mass and energy residuals. These diagnostics are evidence about numerical/accounting consistency, not proof of physical validity.

## Pressure warning

If the ideal-gas pressure diagnostic is enabled, the result records `IDEAL_GAS_APPROXIMATION_ACTIVE`. This prevents a future UI/AI layer from presenting the pressure as universally valid for liquids, saturated mixtures, or high-pressure non-ideal systems.

## Next physics increments

1. phase-aware water/steam property path using IAPWS;
2. heat-transfer boundary model;
3. vacuum pump and valve dynamic models;
4. evaporation/condensation mass-transfer model;
5. vessel wall thermal mass and geometry;
6. pressure-rate safety/interlock model;
7. material-specific kinetic adapters;
8. comparison against measured laboratory time-series data.
