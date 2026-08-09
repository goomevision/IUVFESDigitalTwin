# IUVFES Scientific Material Knowledge Base

## Purpose

The Scientific Material Knowledge Base (SMKB) is the evidence layer between literature/standards and the IUVFES Digital Twin. It provides starting knowledge without converting literature values into unqualified universal constants.

## Evidence hierarchy

- **A — authoritative standard/formulation**: standards or authoritative property formulations.
- **B — peer-reviewed experimental literature**: published experimental results with method/context.
- **C — credible technical database**: curated technical property data.
- **D — secondary literature**: useful for discovery, weaker as a primary engineering source.
- **E — estimated/unresolved**: not suitable as a validated engineering input.
- **M — measured by IUVFES**: direct measurement in the project.
- **V — validated**: supported by an appropriate IUVFES validation campaign and provenance.

## Validation status

`RAW → LITERATURE/STANDARD → CALCULATED → MEASURED → CALIBRATED → VALIDATED`

`DATA_GAP` is used when a property is needed but a sufficiently supported numeric value has not yet been extracted. A data gap is not filled by guessing.

## Seed materials

### Water

Use IAPWS formulations for thermodynamic and thermal-conductivity properties. The model should evaluate properties as functions of temperature and pressure rather than hard-code one universal value.

### Patchouli leaf (`Pogostemon cablin`)

Seed evidence covers drying/moisture, extraction yield and GC-MS oil composition. These are literature observations and must retain experimental conditions such as moisture, maturity, particle size, extraction method, temperature, pressure and time.

Structural carbohydrate/lignin and extractive methods are referenced through NREL procedures, but patchouli-specific numeric values remain `DATA_GAP` until the actual literature value and extraction context are recorded.

### Cellulose / hemicellulose / lignin

These are reserved as component materials. Their numeric thermophysical/chemical properties must be populated from specific authoritative or peer-reviewed sources before being used as model inputs.

### Stainless steel 316L

The seed record intentionally contains no numeric engineering values. A dedicated authoritative material standard or manufacturer datasheet must be attached with grade, product condition, temperature and applicable test/allowable basis before the values are used for structural or thermal engineering.

## Required evidence fields

Each numeric property should eventually carry:

- material ID;
- property name;
- value or range;
- unit;
- temperature;
- pressure;
- moisture/composition where relevant;
- measurement/test method;
- source ID;
- DOI/URL;
- table/figure/page or equivalent source location;
- uncertainty when reported;
- evidence grade;
- validation status.

## AI rule

AI may use literature evidence to build priors, correlations and candidate hypotheses. AI must not silently convert a literature value into a measured or validated IUVFES value. Conflicting sources should remain separate until a documented reconciliation/calibration process is performed.

## Engineering rule

A material property without a valid operating condition is not automatically applicable to the current simulation. Temperature, pressure, moisture, phase and manufacturing condition are part of the property identity.

## Next ingestion work

1. Extract patchouli-specific numeric values from the cited papers into evidence records.
2. Add authoritative 316L sources and temperature-dependent properties.
3. Add cellulose/hemicellulose/lignin thermophysical datasets.
4. Add uncertainty and source-location fields for every numeric observation.
5. Connect the SMKB to the material-selection UI and thermal/physical models only through validated adapters.
6. Add conflict detection when multiple sources report materially different values.
