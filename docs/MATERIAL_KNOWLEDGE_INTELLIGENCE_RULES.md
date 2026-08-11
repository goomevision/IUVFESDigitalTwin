# IUVFES Material Knowledge Intelligence Rules

## Purpose

This document defines how the Material Knowledge Base becomes more useful over time without turning literature assumptions into physical truth.

## 1. Identity before learning

A material must be normalized before evidence is merged.

Identity key:

`scientificName + plantPart`

Aliases (common name, synonym, local name, source label) map to the same material when identity is confirmed.

Never create a second material merely because a new paper uses a different label.

## 2. Evidence is append-only

A new literature or laboratory result creates a new ExperimentRecord/evidence record. Existing observations are never overwritten.

If two records differ, retain both and create an EvidenceConflict when the difference may affect interpretation.

## 3. Frequency semantics

Three concepts are always separate:

- `reportedOperatingFrequency`: frequency used by a reported experiment.
- `observedResponsePeak`: peak detected from a measured response sweep.
- `f0/modelFit`: fitted model parameter derived from response data.

A reported operating frequency can never automatically populate `f0`.

## 4. Unknown-first rule

Unknown values remain `NULL` plus `ValueStatus.UNKNOWN` where applicable.

The system must not infer f0, bandwidth, Q-factor, acoustic intensity, cavitation intensity, or fraction identity solely because a literature record lacks them.

## 5. Source confidence is not model confidence

`Provenance.sourceConfidence` describes confidence in the source/record.

`KnowledgeStatus.confidenceScore` describes confidence in the current knowledge claim.

A high-quality paper reporting 40 kHz does not produce high confidence that 40 kHz is a resonance.

## 6. Protocol-aware comparison

Results may only be compared as directly equivalent when relevant protocol conditions are compatible.

At minimum compare:

- material/plant part and batch where available;
- solvent and solvent ratio;
- frequency;
- power and intensity when available;
- amplitude/duty cycle;
- temperature;
- pressure/vacuum;
- time;
- material loading and particle size where available;
- analytical method.

If conditions differ materially, retain the records but classify the comparison as protocol-dependent rather than contradictory.

## 7. Unit and semantic validation

Before analysis, validate units and semantic meaning.

Examples:

- `mg/g` is not interchangeable with `mg/100 mL`.
- yield percent is not concentration.
- electrical power is not acoustic intensity.
- amplitude percent is not acoustic power.
- atmospheric pressure is not vacuum pressure.

Unresolved unit ambiguity creates a `MaterialGap` or `EvidenceConflict` rather than a guessed conversion.

## 8. Duplicate detection

Potential duplicates should be identified using normalized material identity, plant part, source/provenance, protocol signature, timestamp/batch, and result signature.

A duplicate candidate is reviewed; it is not silently discarded.

## 9. Learning pipeline

`Literature/Lab evidence`

→ normalize identity

→ validate units

→ validate provenance

→ detect duplicates

→ detect conflicts

→ store immutable evidence

→ update MaterialGap

→ analyze sweep data when available

→ detect significant peaks

→ fit candidate models

→ create versioned MaterialProfile

→ recommend next experiment

→ compare prediction against independent laboratory data

→ promote knowledge status only when evidence supports it.

## 10. Active-learning guardrails

Experimental recommendations must prefer information gain and uncertainty reduction, but cannot invent laboratory capabilities or required measurements.

If the system lacks enough data for a meaningful model, recommend a controlled coarse sweep rather than pretending that a Gaussian Process is reliable.

A recommendation is a proposed experiment, not a result.

## 11. Calibration and validation separation

Data used to fit f0, bandwidth, kinetic parameters, or other model parameters must not be treated as independent validation data.

Validation requires independent observations according to the experiment protocol.

## 12. Material profile promotion

`DRAFT → ACTIVE → DEPRECATED` is evidence-driven.

A profile based only on literature remains a reference profile and does not become a validated resonance profile.

A laboratory-derived profile can be `MODEL_FIT` before independent validation.

Only validated evidence may support `VALIDATED` status.

## 13. Four-fraction rule

Four output fractions are an experimental architecture, not a predefined molecular truth.

The system may store Fraction 1–4 inventory and recovery, but must not label them fiber/lipid/protein/bound-water solely from frequency until laboratory composition analysis supports those labels.

## 14. Intelligence objective

The Material Knowledge Base is considered more intelligent when it can answer four questions reliably:

1. What do we know?
2. Where did it come from?
3. What remains unknown or conflicting?
4. What experiment would most usefully reduce the uncertainty?

It is not considered more intelligent merely because it produces more predicted numbers.
