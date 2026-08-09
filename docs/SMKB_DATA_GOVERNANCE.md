# Scientific Material Knowledge Base — Data Governance

## Purpose

The Scientific Material Knowledge Base (SMKB) supplies initial evidence for the Digital Twin. It is not a bag of constants and it is not a substitute for measured/calibrated material data.

## Evidence hierarchy

- **A — authoritative standard/formulation**: standards or authoritative property formulations such as IAPWS.
- **B — peer-reviewed experimental literature**: useful priors whose sample and process conditions must remain attached.
- **C — manufacturer/technical datasheet**: useful engineering input, product/condition dependent.
- **D — secondary literature**: discovery/reference only until corroborated.
- **E — estimate/inference**: never silently promoted to measured data.
- **M — measured by IUVFES/connected laboratory**.
- **V — validated against independent evidence**.

## Required provenance

Every numeric property intended for simulation should retain:

1. material identity;
2. property name;
3. value or range;
4. unit;
5. applicable temperature and pressure where relevant;
6. moisture/composition condition where relevant;
7. measurement/calculation method;
8. source identifier;
9. source location (page/table/figure when available);
10. uncertainty when reported;
11. validation status.

## No-invention rule

If a property is not supported by an appropriate source, record `DATA_GAP`. Do not insert a plausible value merely to make the simulator run.

A `DATA_GAP` is useful information: it identifies a property that must be measured, sourced, or modeled before a higher-confidence simulation can depend on it.

## Current seed policy

### Water
Use IAPWS formulations as the authoritative thermodynamic basis instead of hard-coded universal values.

### Patchouli (`Pogostemon cablin`)
Literature values are retained as process/sample-dependent evidence. Moisture, maturity, drying, particle size and extraction conditions must remain part of the record. Patchouli-specific cellulose/lignin/extractives values remain data gaps until a numeric source is extracted and cited.

### Stainless steel 316L
A manufacturer datasheet seed is available under `data/smkb/316L-alleima-seed.json`. It contains only values explicitly supported by the cited source. A dedicated specific-heat curve and pressure-vessel allowable-stress dataset are intentionally not fabricated.

## Simulation use

The Digital Twin should distinguish:

`STANDARD / LITERATURE / DATASHEET` → prior/input evidence

`MEASURED` → observed laboratory/instrument evidence

`CALIBRATED` → parameter adjusted against specified measured data

`VALIDATED` → model performance independently checked against defined acceptance criteria

These statuses must not be collapsed into a single confidence number.

## AI use

AI may use literature and measured data to identify patterns, propose parameter ranges, detect gaps and generate hypotheses. AI output remains an interpretation until supported by traceable evidence and validation.
