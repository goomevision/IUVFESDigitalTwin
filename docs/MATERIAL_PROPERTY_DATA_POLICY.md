# Material Property Data Policy

IUVFES now distinguishes source-backed pure-component properties from multicomponent material composition.

## Water

The first temperature-dependent property implemented is water vapor pressure using the NIST Chemistry WebBook SRD 69 Antoine correlation for 273–303 K:

`log10(P_bar_abs) = A - B/(T_K + C)`

with A = 5.40221, B = 1838.675, C = -31.737 for the cited Bridgeman and Aldrich correlation. The implementation rejects temperatures outside the declared correlation range rather than extrapolating silently.

NIST also exposes additional water thermochemistry, phase-change, PVT and fluid-property datasets; these should be ingested as separate, source-specific records rather than mixed into one opaque property value.

## Patchouli oil

Patchouli essential oil is treated as a multicomponent mixture, not as pure patchoulol. Literature reports numerous sesquiterpenes and substantial composition variability; therefore a production simulation must carry either a batch composition or an explicitly selected literature composition with provenance.

The current mixture schema includes patchoulol, alpha-guaiene, alpha-bulnesene, seychellene, alpha-patchoulene and beta-caryophyllene as tracked components, but their fractions remain null until measured or sourced composition data are supplied.

## No silent extrapolation

A property record must declare:

- source ID;
- equation/correlation where applicable;
- coefficients;
- valid temperature/pressure range;
- units;
- provenance;
- uncertainty, when the source provides one;
- whether the value is measured, literature-derived, fitted, or modeled.

If a required property is outside its valid range or missing, the simulator should emit an evidence/data-quality blocker rather than silently inventing a value.

## Scientific boundary

The material registry does not by itself establish a complete phase-equilibrium model. Multicomponent vacuum evaporation requires component-specific vapor-liquid equilibrium, activity/fugacity treatment where justified, latent heats, heat capacities, mass-transfer coefficients and composition evolution. Those are subsequent model layers.
