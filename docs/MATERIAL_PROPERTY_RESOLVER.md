# IUVFES Material Property Resolver

## Purpose

The resolver is the boundary between the Scientific Material Knowledge Base (SMKB) and simulation models.

It converts a material identity plus physical condition into an evidence-backed property value when the catalog supports that condition.

## Resolution contract

```text
material + state + temperature + pressure + moisture
                    |
                    v
             evidence catalog
                    |
        +-----------+-----------+
        |                       |
        v                       v
    RESOLVED                 DATA_GAP
        |
        v
   simulation
```

A third status, `UNSUPPORTED_STATE`, is returned when the requested physical state is not represented in the material evidence catalog.

## Temperature tables

For tabulated properties such as the current SS316L thermal conductivity and specific heat data, the resolver performs **linear interpolation only inside the evidence-backed temperature range**.

It does not extrapolate beyond the supplied range.

Example:

```text
20 C ---- 100 C ---- 200 C ---- 300 C
             \       /
              \     /
              interpolation
```

An out-of-range request becomes `DATA_GAP`.

## Fixed reference values

A property supplied at a single reference temperature is only resolved at that temperature. The resolver does not manufacture a temperature coefficient from one observation.

## Scientific boundary

The resolver is a data-access and evidence-selection layer. It is not a validation engine and it does not prove physical correctness. A resolved literature/standard/manufacturer value remains marked by its source and validation status.

## Why this matters

The same simulation engine can now request properties by physical condition rather than hard-coding a single global value:

```text
Water + liquid + T + P
Ethanol + vapor + T + P
Patchouli + dried + moisture + T
SS316L + solid + T
```

If evidence is insufficient, the correct behavior is to stop at `DATA_GAP` and expose the missing measurement/model as a research target.

## Next extension

The next resolver version should add:

- pressure-dependent surfaces;
- moisture-dependent biomass properties;
- mixture/component resolution;
- unit normalization;
- uncertainty propagation;
- evidence ranking when multiple sources overlap;
- explicit provenance IDs linked to dataset manifests.
