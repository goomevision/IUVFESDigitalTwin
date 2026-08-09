# Design Evidence Binding

IUVFES now defines a traceability gate between a simulation result and an engineering drawing package.

## Required evidence chain

```text
Simulation Run
  -> Validation Report
  -> Dataset IDs
  -> Hardware Model Version
  -> Physics/Model Version
  -> Governing Equation IDs
  -> Key Outputs
  -> Assumptions
  -> Uncertainties
```

A complete chain is marked `TRACEABLE`. Missing core evidence is marked `INCOMPLETE` and exposes explicit blockers.

## Design implication

A dimension shown on an engineering drawing should eventually be attributable to a controlled design input or an approved engineering calculation. The simulator must not silently convert an observed result into a structural safety claim.

## Release boundary

`TRACEABLE` means auditable evidence exists. It does not mean the design is safe or approved for fabrication.

Fabrication release still requires competent engineering review, applicable design-code calculations, material and joint verification, relief/safety review, and required prototype/physical validation.
