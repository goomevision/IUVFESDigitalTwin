# Material Property Registry

IUVFES now has an evidence-first registry for material identity and thermophysical properties.

## Design rule

A material record must distinguish between:

- pure component;
- mixture;
- raw botanical material.

This prevents a pure-compound property set from being silently applied to an essential-oil mixture or raw plant material.

## Property classes

The registry can hold, when supported by evidence:

- molecular weight;
- density;
- heat capacity;
- latent heat;
- temperature-dependent vapor pressure.

Each property must ultimately be linked to a source, applicable range, method and provenance. Missing properties are intentionally left missing; the system must not invent values merely to make a simulation run.

## Current evidence seeds

### Water

NIST Chemistry WebBook identifies water as H2O, CAS 7732-18-5, molecular weight 18.0153. NIST SRD 69 also provides thermochemical/phase-change and fluid-property data that can be used as source material for later property ingestion. See NIST Chemistry WebBook, SRD 69.

### Patchouli alcohol

NIST Chemistry WebBook identifies patchouli alcohol/patchoulol as C15H26O, CAS 5986-55-0, molecular weight 222.3663. This is a pure compound identity record and is explicitly **not** treated as a complete patchouli essential-oil model.

## Scientific boundary

A raw botanical such as patchouli leaves and a commercial patchouli essential-oil mixture cannot be simulated correctly by substituting a single pure-compound record. Composition, moisture, extraction history and operating conditions must be represented when relevant.

## Next ingestion stage

The next material-data stage should add source-backed temperature-dependent properties, uncertainty, applicable ranges and mixture composition. Journal literature should be linked at the property level, not merely listed as generic references.
