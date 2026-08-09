# Unknown Material Knowledge Loop

IUVFES supports a controlled path for materials that are not yet present in the registry.

## Principle

An unknown material does not cause the simulator to invent missing properties. Instead, the operator is asked for the minimum properties required by the selected physics model and for the evidence supporting each value.

Typical inputs can include:

- material identity and basis;
- density;
- heat capacity;
- latent heat when phase change is enabled;
- vapor-pressure data or relation when evaporation/VLE is enabled;
- composition for mixtures/raw botanicals when available;
- measurement or estimation method;
- source/provenance reference;
- operator and submission time.

## State machine

```text
UNKNOWN
   ↓
OPERATOR INTAKE
   ↓
PARTIAL ─────────→ MORE DATA REQUIRED
   ↓
READY_FOR_REVIEW
   ↓
EVIDENCE REVIEW
   ↓
REGISTERED
   ↓
AVAILABLE FOR SIMULATION
```

A duplicate material ID is not silently overwritten.

## Learning loop

Every accepted material record becomes reusable evidence for future studies. The registry should retain the original operator submission, reviewed values, revisions, provenance, validity range and uncertainty rather than collapsing them into one anonymous number.

```text
NEW MATERIAL
   ↓
MEASUREMENT / LITERATURE
   ↓
PROPERTY RECORD
   ↓
VALIDATION
   ↓
MATERIAL REGISTRY
   ↓
FUTURE SIMULATIONS
   ↓
NEW EXPERIMENTAL EVIDENCE
   └──────────────→ PROPERTY REVISION
```

## AI boundary

AI may help identify missing fields, suggest relevant literature searches, compare submitted values with existing evidence, and flag inconsistencies. AI must not turn an estimate into a measured fact or silently fill missing values.

For mixtures and raw botanicals, composition/batch evidence should be preserved. A mixture must not be silently represented as a pure component merely because one component is dominant.

## Engineering boundary

A material record being registered does not make it safe or validated for fabrication. Process, pressure, thermal, structural and safety calculations still require appropriate models, uncertainty analysis and competent engineering review.
