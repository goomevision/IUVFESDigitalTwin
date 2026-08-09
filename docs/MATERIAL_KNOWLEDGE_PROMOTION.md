# Material Knowledge Promotion

IUVFES now defines a controlled bridge from a newly discovered component to a simulation-eligible material model.

## Principle

A new observation enriches the knowledge base immediately, but it does not automatically become a trusted simulation fact.

```text
Discovery
  ↓
Evidence
  ↓
Property records
  ↓
Review / validation
  ↓
Promotion
  ↓
Simulation material model
```

## Evidence states

- `OBSERVED`: directly detected/recorded in an experiment.
- `LITERATURE_REPORTED`: reported by an identified external source.
- `INFERRED`: proposed by analysis or AI and not yet established as fact.

An `INFERRED` discovery is blocked from promotion.

## Property gate

A material/component can be promoted only when every property required by the target simulation model has a `VALIDATED` evidence record with source and provenance identifiers.

The required-property list is model-specific. For a vaporization model it may include density, composition, temperature-dependent vapor-pressure behavior, heat capacity, latent heat, and mass-transfer parameters. The exact list must follow the physics model actually being used.

## Historical integrity

Promotion creates a new usable material-model revision; it must not rewrite historical experiments or silently replace earlier model versions.

```text
Material Model v1
      ↓
Discovery
      ↓
Material Model v2
```

Both versions remain traceable so simulation differences can be attributed to the knowledge change.

## AI boundary

AI can suggest identities, search literature, identify missing properties, and flag inconsistencies. It cannot convert an inference into a validated property without evidence and review.
