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

## Scientific API

`scientific.balanceValidation` exposes both checks to the research workflow. The request must identify an existing research experiment owned by the caller (or an administrator). At least one balance domain must be supplied.

Each domain requires an explicit absolute or relative tolerance to produce PASS/FAIL. Without an explicit tolerance, the domain remains INCONCLUSIVE.

## Scientific boundary

A passing balance means the declared accounting closes within the supplied tolerance. It does not prove instrument accuracy, process physics, model validity, or scientific truth. Balance results must remain linked to the experiment's provenance and raw observations.
