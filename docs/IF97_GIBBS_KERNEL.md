# IUVFES IF97 Gibbs Derivative Kernel

## What was implemented

`server/if97GibbsDerivativeKernel.ts` provides the mathematical evaluator required by the IAPWS-IF97 Region 1/2 Gibbs formulations:

- dimensionless Gibbs free energy `gamma`;
- first derivatives `gamma_pi`, `gamma_tau`;
- second derivatives `gamma_pi_pi`, `gamma_tau_tau`;
- mixed derivative `gamma_pi_tau`;
- conversion to specific volume, enthalpy, entropy, internal energy and heat capacity.

The evaluator is coefficient-driven. It does **not** embed guessed Region 1 or Region 2 coefficients.

## Why coefficient-driven

IAPWS-IF97 uses a different fundamental equation for each region. For Regions 1 and 2, IAPWS expresses the dimensionless Gibbs free energy as a finite sum of coefficient/exponent terms. The appropriate derivatives then yield thermodynamic properties. IAPWS explicitly states that combinations of derivatives can produce density/specific volume, heat capacity, enthalpy, entropy and other properties. See the official R7-97(2012) release: https://www.iapws.org/relguide/IF97-Rev.pdf

## Current status

```text
Gibbs mathematics                 IMPLEMENTED
Coefficient table integration     PENDING
Region-specific property solver  PENDING
IAPWS verification values         REQUIRED
Production promotion              NOT YET
```

This distinction is deliberate. The mathematical engine can be tested independently before the official Region 1/2 coefficient tables are connected.

## Property equations

For `g = R*T*gamma`, `pi = p/p*`, and `tau = T*/T`:

```text
v  = R*T/p* * gamma_pi
h  = R*T * tau*gamma_tau
s  = R * (tau*gamma_tau - gamma)
u  = R*T * (tau*gamma_tau - pi*gamma_pi)
cp = -R*tau^2*gamma_tau_tau
```

The implementation keeps pressure and temperature scales explicit so region adapters cannot accidentally mix units.

## Promotion gate

The next commit must add the official Region 1 and Region 2 coefficient/exponent tables from IAPWS R7-97(2012), then test the resulting properties against the IAPWS verification points. Only after those tests pass may the property adapter return `IMPLEMENTED` rather than `DATA_GAP`.

## Scientific boundary

This kernel is a numerical implementation component, not a validation claim. A mathematically correct derivative evaluator does not by itself prove that a simulation matches a physical experiment.
