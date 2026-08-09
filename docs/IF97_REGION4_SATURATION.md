# IUVFES — IAPWS-IF97 Region 4 Saturation

IUVFES now implements the IAPWS-IF97 Region 4 saturation-pressure equation for ordinary water.

## Implemented path

```text
T_abs (K)
   ↓
IF97 Region 4 validity check
   ↓
Eq. (29)/(30) coefficient evaluation
   ↓
p_sat (MPa)
```

The implementation uses the Region 4 coefficients from IAPWS R7-97(2012), Section 8 / Table 34. IAPWS describes Region 4 as the saturation line and provides the saturation-pressure equation as an implicit relation that can be solved directly for saturation pressure. The formulation is valid from the triple-point temperature to the critical temperature. 

## Reference tests

The repository tests include:

- normal boiling point: 373.15 K → approximately 0.101325 MPa;
- critical point: 647.096 K → approximately 22.064 MPa;
- out-of-domain temperatures are rejected.

## Scientific boundary

This implementation provides **saturation pressure as a function of temperature**. It does not yet provide the full two-phase property state, quality, enthalpy, entropy, density, or evaporation/condensation kinetics.

Those require the corresponding IAPWS Region 1/2/3 property formulations and the phase-equilibrium logic around Region 4.

## Safety implication

A falling pressure does not by itself mean a material has instantly vaporized. The process solver must compare the current thermodynamic state against the saturation boundary and then apply phase-change and heat/mass-transfer models with an explicit time step.
