# Material Discovery Knowledge Loop

IUVFES treats a newly detected substance as new evidence, not as an automatic truth or an automatic replacement for prior material knowledge.

## Evidence classes

- `OBSERVED`: directly detected/measured in an identified sample or experiment.
- `LITERATURE_REPORTED`: reported by an external source.
- `INFERRED`: model/AI inference that still requires explicit validation before becoming validated evidence.

## Discovery lifecycle

```text
Experiment / Literature
        ↓
Material Discovery
        ↓
Component + concentration + conditions
        ↓
Properties + provenance
        ↓
Review / validation
        ↓
Material Knowledge Base
        ↓
Updated material model
        ↓
New simulation
```

## Example: patchouli oil

A future experiment may identify a component not present in the current patchouli-oil model. The discovery receives its own `Discovery ID`, sample/batch context, analytical method, concentration and provenance. Its properties can then be added without deleting earlier records.

The same component may later be observed in another material. The component identity can be linked across material records while preserving each sample's concentration, conditions and evidence.

## Versioning principle

A new discovery must not silently rewrite historical simulation results. Instead:

```text
Material Model v1
      ↓ new discovery
Material Model v2
      ↓
re-simulation / comparison
```

The system should retain the model version used by every study and report the change in outputs when a material model is updated.

## AI boundary

AI may suggest candidate identities, missing properties, literature sources, inconsistencies and follow-up measurements. AI-generated inference must remain explicitly labelled `INFERRED` until supported by validation evidence.

## Knowledge quality

The database becomes more useful as it accumulates evidence, but larger does not automatically mean more correct. Provenance, sample context, uncertainty, analytical method and validation status remain mandatory parts of the knowledge record.
