# Vacuum Structural Screening Boundary

## Purpose

IUVFES now provides a preliminary computational screen for cylindrical vacuum-shell designs. The result is intended to identify designs that deserve early engineering review before detailed design work.

## Inputs

- internal diameter;
- cylindrical unsupported length;
- wall thickness;
- design external pressure;
- elastic modulus;
- Poisson ratio;
- yield strength;
- selected safety factor;
- optional unsupported-length factor.

## Outputs

- critical elastic pressure estimate;
- screening allowable pressure;
- utilization;
- margin;
- `PASS_SCREENING`, `REVIEW_REQUIRED`, or `INVALID_INPUT`;
- explicit warnings and limitations.

## Critical boundary

`PASS_SCREENING` does **not** mean that a vessel is safe, code-compliant, manufacturable, or ready for operation. It means only that this simplified screening calculation did not exceed its own preliminary threshold.

The model does not currently evaluate heads, openings/nozzles, reinforcement, stiffeners, welds, supports, local buckling, ovality, fabrication imperfections, external attachments, thermal stresses, cyclic fatigue, corrosion allowance, relief devices, vacuum breaker sizing, or applicable pressure-vessel code requirements.

## Engineering workflow

```text
VIRTUAL GEOMETRY
      ↓
PRELIMINARY SCREENING
      ↓
FAIL / REVIEW / SCREEN PASS
      ↓
DETAILED CODE CALCULATION
      ↓
DRAWING + MATERIAL CERTIFICATION
      ↓
FABRICATION / NDE / INSPECTION
      ↓
PRESSURE / VACUUM TESTING
      ↓
COMMISSIONING DATA
      ↓
VALIDATED DIGITAL TWIN
```

The simulator must retain the evidence and provenance of every structural input. A value without a source remains an engineering assumption or required input, not a validated physical fact.
