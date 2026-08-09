# IUVFES Material Physics Adapter

## Purpose

The Material Physics Adapter is the controlled boundary between the Scientific Material Knowledge Base (SMKB) and process-physics simulation.

The adapter prevents literature/catalog metadata from being treated as validated physical truth.

## Resolution states

- `SUPPORTED`: the requested property/model is sufficiently evidenced for the requested operating domain.
- `PARTIAL`: some evidence exists, but one or more required properties or validation steps are still missing.
- `DATA_GAP`: the material or required property is not sufficiently represented in SMKB.

## Non-negotiable rule

The adapter must never invent a missing thermophysical value.

If the requested state, temperature, pressure, moisture condition, or property surface is outside the evidence-backed domain, the result remains `PARTIAL` or `DATA_GAP` and identifies the missing information.

## Intended process boundary

```text
SMKB evidence
    -> material state
    -> property resolver
    -> material physics adapter
    -> thermal / mass / pressure models
    -> machine dynamics
    -> sensors / actuators
    -> safety kernel
    -> scientific comparison
```

## Current material coverage

| Material | Current adapter status | Important gaps |
|---|---|---|
| Water | PARTIAL | state-dependent IAPWS property resolution |
| SS316L | PARTIAL | design stress, weld efficiency, fatigue |
| Patchouli | PARTIAL | condition-dependent thermal properties, validated kinetics |
| Coconut shell | PARTIAL | complete thermal surface and reaction kinetics |
| Ethanol | PARTIAL | full T/P surface and mixture VLE |
| Glycerol | PARTIAL | T-dependent density, viscosity, Cp and conductivity |

This is intentionally conservative. A material being present in the catalog does not mean that every physical model is validated.
