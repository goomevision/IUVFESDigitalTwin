# SMKB Multi-Material Simulation Batch 1

## Tujuan

IUVFES tidak boleh menjadi simulator yang hanya memahami Pogostemon cablin. Batch ini memperluas material knowledge base menjadi katalog awal lintas kelas material yang realistis untuk eksperimen termal, ekstraksi, pengeringan, pemisahan, kondensasi, dan virtual hardware.

## Material awal

| ID | Material | Kelas | Peran simulasi | Status |
|---|---|---|---|---|
| MAT-WATER-H2O | Water | Process fluid | heating, cooling, evaporation, condensation, vacuum | STANDARD |
| MAT-ETHANOL-C2H6O | Ethanol | Process fluid | extraction, evaporation, condensation, separation | LITERATURE |
| MAT-GLYCERIN-C3H8O3 | Glycerol | Process fluid | solvent / heat-transfer / mixture studies | LITERATURE |
| MAT-PATCHOULI-LEAF-POGOSTEMON-CABLIN | Patchouli leaf | Biomass | drying, distillation, extraction, mass/energy balance | LITERATURE |
| MAT-COCONUT-SHELL-BIOMASS | Coconut shell | Biomass | drying, combustion, thermal processing | LITERATURE |
| MAT-SS316L-SANMAC | Sanmac 316/316L | Hardware material | chamber wall, vessel, heat transfer, thermal stress | MANUFACTURER_DATA |

## Evidence discipline

A catalog entry is not a universal constant. Properties are retained with their source and, where known, temperature/pressure/material-state conditions. Literature observations from different experiments must not be averaged into one value unless a documented model supports that aggregation.

### Evidence hierarchy

- A — authoritative standard/formulation;
- B — peer-reviewed experimental literature;
- C — manufacturer technical datasheet;
- D — secondary technical source;
- E — estimate/inference.

`MEASURED`, `CALIBRATED`, and `VALIDATED` are separate lifecycle states and cannot be inferred merely from a literature source.

## Modeling rule

For every material, the Digital Twin should resolve properties using:

```text
material state
+ temperature
+ pressure
+ moisture/composition
+ particle/geometry condition
+ source/evidence
        ↓
property resolver
        ↓
physics model
```

If the required property surface is not available, the resolver must return `DATA_GAP` rather than silently inventing a number.

## Why these materials

### Water
A foundational process fluid. IAPWS-IF97 is recommended for industrial thermodynamic calculations and supports derivation of density, heat capacity, enthalpy, entropy and other properties. IAPWS R15-11 provides thermal conductivity. 

### Ethanol
A useful volatile solvent/reference fluid for extraction, evaporation and condensation scenarios. NIST Chemistry WebBook SRD 69 provides thermochemical and phase-change data, including liquid heat-capacity observations.

### Glycerol
A useful high-boiling, viscous liquid for solvent and heat-transfer sensitivity studies. NIST identifies glycerin/glycerol as C3H8O3, CAS 56-81-5, and provides its reference data collection. Temperature-dependent transport properties remain a data gap until sourced at the required quality.

### Patchouli leaf
The primary Aceh-relevant biomass case. The model must distinguish fresh, dried, pre-distillation and post-distillation residue states because composition and thermal behavior are process-dependent.

### Coconut shell
A second locally relevant biomass class with published experimental thermal-characteristics work, making it useful for testing whether the model architecture generalizes beyond essential-oil feedstock.

### SS316L
A representative chamber/hardware material. The Alleima Sanmac 316/316L datasheet supplies density, temperature-dependent thermal conductivity, specific heat and thermal expansion values suitable as initial manufacturer evidence. It does not by itself establish vessel design allowable stress, weld qualification, fatigue life, or pressure-vessel certification.

## Next property expansion

The next ingestion batches should add, where evidence exists:

1. density vs temperature/moisture;
2. Cp vs temperature;
3. thermal conductivity vs temperature/moisture;
4. viscosity vs temperature for liquids;
5. vapor pressure / phase equilibrium;
6. latent heat / enthalpy of vaporization;
7. biomass proximate analysis;
8. cellulose / hemicellulose / lignin / extractives / ash;
9. drying kinetics;
10. reaction or decomposition kinetics where applicable;
11. uncertainty and measurement method;
12. source DOI/page/table/figure provenance.

## Safety boundary

Material data in this catalog are simulation inputs. They do not certify a physical vessel, heater, vacuum system, pressure boundary, relief device, or operating procedure. Physical design approval requires applicable codes, material certificates, geometry, fabrication/welding data, inspection, calibration and qualified engineering review.
