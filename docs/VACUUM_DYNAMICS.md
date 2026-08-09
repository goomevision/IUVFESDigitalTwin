# Transient Vacuum Dynamics

IUVFES now has a first-order time-resolved vacuum vessel dynamics layer.

## Model

For a rigid vessel at a specified gas temperature, the current engineering model uses:

`P V = n R T`

and advances gas inventory with:

`dn/dt = n_dot_generated - n_dot_pumped`

where pump throughput is approximated by:

`S_eff = S_nominal * valve_opening`

and pumped molar flow is derived from the current absolute pressure and effective speed.

## Important boundary

This is a transient engineering model, not a complete pump OEM curve, conductance network, molecular-flow model, compressible CFD model, or non-equilibrium two-phase model.

The model must therefore expose its assumptions and must not be presented as a validated hardware prediction until calibrated against the actual vessel, pump, valves, leaks, temperature, and instrument response.

## Why time matters

Pressure is advanced one time step at a time. The model does not allow the simulator to jump directly from atmospheric pressure to an arbitrary maximum vacuum state.

This enables the safety layer to observe:

- pressure rate of change `dP/dt`;
- rapid decompression transients;
- rapid pressure-rise transients;
- interaction between vapor generation and pumping capacity.

## Safety integration

A transient warning is diagnostic only. A production interlock must use engineering acceptance limits established for the actual vessel, pump, valves, instrumentation, materials, and operating procedure.

The simulator should support separate thresholds for:

1. advisory;
2. warning;
3. alarm;
4. controlled shutdown;
5. emergency trip.

Those thresholds must be configured from evidence/engineering requirements, not invented by AI.

## Next integration

Connect this layer to:

`WaterSteamState -> evaporation/condensation -> vapor generation -> vacuum dynamics -> sensor model -> safety kernel`.

The eventual production model must also incorporate pump performance curves, conductance, valve characteristics, leakage, wall heat transfer, and calibrated sensor dynamics.
