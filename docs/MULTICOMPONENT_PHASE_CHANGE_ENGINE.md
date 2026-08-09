# Multicomponent Phase Equilibrium and Evaporation

IUVFES now has an explicit first thermodynamic layer for multicomponent vapor-liquid equilibrium (VLE).

## Equilibrium layer

The current engine supports an ideal-mixture TP flash using:

- Raoult's law for the liquid phase;
- Dalton's law / ideal-gas vapor;
- `K_i = P_sat,i / P`;
- Rachford-Rice bisection for two-phase split.

IUPAC defines ideal Raoult behavior as `p_i = p_i* x_i = y_i P` when the ideal-mixture assumptions apply. citeturn0search3 NIST's `teqp` documentation describes TP flash as a general phase-equilibrium problem for mixtures and phases. citeturn0search6

## Why this is only the first model

Raoult's law is appropriate only when its assumptions are defensible. Ansys documentation explicitly notes that ideal-solution assumptions can be unrealistic and that more advanced EOS/activity-coefficient models are needed for non-ideal systems or higher-pressure regimes. citeturn0search0

Therefore the result carries its assumptions and must not be labelled universally validated.

## Dynamic evaporation layer

Equilibrium does not determine the rate at which mass crosses the interface. The dynamic layer therefore uses an explicit mass-transfer coefficient/fraction per second and a bounded timestep update. The coefficient is not inferred from VLE.

This separation is intentional:

```text
THERMODYNAMIC EQUILIBRIUM
        ↓
possible phase split / composition
        ↓
KINETIC / MASS-TRANSFER MODEL
        ↓
actual mass removed per timestep
        ↓
ENERGY BALANCE
        ↓
new temperature
        ↓
new equilibrium
```

## Conservation rule

The evaporation step cannot remove more liquid moles than are available. Component inventories are retained separately so that composition changes can be traced over physical time.

## Patchouli oil boundary

Patchouli oil must not be represented as pure patchoulol. It is a multicomponent natural product. A mixture calculation requires measured or source-backed composition and component property data. If composition, vapor-pressure data, activity coefficients, or an appropriate EOS are missing, the simulation must report incomplete evidence rather than fabricate them.

## Next thermodynamic upgrades

1. Add validated temperature-dependent vapor-pressure correlations per component.
2. Add activity-coefficient models such as NRTL/UNIQUAC when justified by data.
3. Add EOS/fugacity treatment for regimes where ideal-gas behavior is insufficient.
4. Add energy-conserving flash modes (PH/UV) where the required property data exist.
5. Couple mass-transfer coefficients to geometry, gas flow, interfacial area and vacuum-system behavior.
6. Validate the dynamic model against measured evaporation curves.

The thermodynamic and kinetic layers must remain separately identifiable in every research report.
