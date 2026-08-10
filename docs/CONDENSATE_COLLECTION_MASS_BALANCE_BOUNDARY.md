# Condensate Collection Mass-Balance Boundary

## Purpose

The four receiver layer connects the existing extraction mass signals and cold-trap condensed-water signal to explicit collection-vessel inventories.

## Current model

- Receiver 1: H2O.
- Receiver 2: light aromatic fraction.
- Receiver 3: main patchouli-oil fraction.
- Receiver 4: heavy fraction.
- Receiver capacities are hardware/session parameters.
- Water is routed to Receiver 1 after the cold-trap model reports actual condensed water.
- Recovered oil is routed across Receivers 2–4 using an explicit normalized routing vector.
- Default routing is `[0, 1, 0]`: all recovered oil remains in the main-oil receiver until validated fraction data is supplied.
- Receiver capacity limits are enforced; excess mass is retained as cumulative `unroutedCondensateKg`.
- Per-trap water inventory is tracked independently so the capacity of one trap cannot incorrectly consume the capacity of another trap.

## What this model does not claim

This is a mass-routing and receiver-capacity model. It is **not** a multicomponent vapor-liquid-equilibrium model and does not infer aromatic/light/main/heavy fractions from temperature alone.

Fraction routing should eventually be replaced or constrained by measured composition data, such as GC/GC-MS, together with validated thermodynamic/phase-equilibrium assumptions. Recent literature on vacuum fractional distillation of essential oils emphasizes that composition changes across cuts depend on multicomponent volatility and VLE data, and that experimental validation remains important. 

## Scientific provenance

The simulation must distinguish:

- `MEASURED`: receiver mass actually measured in an experiment;
- `VALIDATED`: routing fraction supported by repeatable experimental evidence;
- `ASSUMED`: temporary design-space fraction used for simulation;
- `DATA_GAP`: no defensible fraction data available.

The current default `[0,1,0]` is therefore a routing baseline, not a claim that the physical product contains no light or heavy components.
