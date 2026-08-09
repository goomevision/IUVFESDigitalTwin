# Vacuum and Mass-Transfer Dynamics

IUVFES now has explicit reduced-order contracts for vacuum-system dynamics and evaporation/mass transfer.

## Vacuum dynamics

The current screening model tracks:

- vessel volume;
- effective pump speed;
- gas mass;
- vapor mass;
- leakage mass rate;
- temperature;
- absolute pressure.

The pump removes mass according to an effective volumetric-speed approximation. Leakage is an explicit source term. Physical time and timestep remain separate from wall-clock computation time.

This is **not** a final vacuum-pump performance model. Real systems require pump curves, conductance, valve characteristics, outgassing, gas composition, temperature dependence, and applicable vacuum-system correlations.

## Mass transfer

The current reduced-order model uses:

`rate = k_m × max(P_equilibrium - P_actual, 0)`

where the transfer coefficient `k_m` must be supplied by an explicit model, correlation, or measurement. This module never invents it.

Mass is conserved between liquid and vapor within the step and cannot become negative.

## Coupling target

The intended coupled loop is:

```text
heater / temperature
       ↓
vapor-pressure model
       ↓
phase equilibrium
       ↓
mass-transfer driving force
       ↓
evaporation
       ↓
vapor mass / liquid mass
       ↓
vacuum dynamics
       ↓
absolute pressure
       ↓
next timestep
```

The coupling must also feed latent heat into the energy balance so that evaporation can change temperature rather than producing mass loss without thermal consequences.

## Scientific boundary

These reduced-order models are development scaffolding. They must not be used as final pressure-vessel, pump-sizing, process-safety, or fabrication calculations without validated physical correlations, measured data, uncertainty analysis, and competent engineering review.
