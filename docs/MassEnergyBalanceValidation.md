# Mass and Energy Balance Validation

IUVFES treats conservation checks as validation evidence, not as automatic correction.

## Mass balance

The validator compares material input against explicitly accounted outputs:

`input = water + oil + solid + waste + other`

It reports closure error and relative closure percentage. A PASS requires an explicit tolerance. Without a tolerance the result is INCONCLUSIVE.

## Energy balance

The validator compares declared energy input against explicitly accounted energy components:

`input = heating + vacuum + extraction + cooling + other`

The validator does not infer missing energy components and does not silently add losses. Missing components must be represented explicitly if they are part of the experimental protocol.

## Scientific boundary

A passing balance means the declared accounting closes within the supplied tolerance. It does not prove instrument accuracy, process physics, or model validity. Balance results must remain linked to the experiment's provenance and raw observations.
