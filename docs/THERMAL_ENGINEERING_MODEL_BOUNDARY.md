# IUVFES Thermal Engineering Model Boundary

## Purpose

The thermal layer provides a lumped-parameter engineering simulation for heat-up and cool-down timing. It makes thermal mass, heater power, cooling power, ambient temperature and effective heat loss explicit.

## Model

For the current first-order model:

`dT/dt = (Q_heater - Q_cooling - Q_loss) / C_thermal`

where `Q_loss = U_eff * max(T - T_ambient, 0)` and `C_thermal` is effective thermal mass in kJ/K.

## What the model can answer

- approximate heat-up time under stated assumptions;
- whether a target temperature is reachable under modeled heat loss;
- effect of changing thermal mass;
- effect of changing heater/cooling power;
- energy added/removed over elapsed time;
- deterministic real-time thermal state evolution.

## What it cannot certify

This is not CFD, a detailed heat-transfer qualification, heater electrical certification, material qualification, or process safety certification. It does not automatically determine boiling, phase change, radiation, contact resistance, spatial temperature gradients, hot spots, thermal stress, or insulation compliance.

## Provenance requirement

`thermalMassKJPerC`, heater power, cooling capacity and effective heat-loss coefficient must be tagged as baseline/assumed/calculated/measured/validated. Real hardware should replace assumptions with datasheet, commissioning and measured evidence.

## Safety boundary

A reachable target temperature is not an assertion that the physical machine is safe. Independent hardware protection, sensor plausibility, interlocks and applicable engineering standards remain mandatory for a physical system.
